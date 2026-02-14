import { ErrorCode } from '@/constants/error-code.constant';
import { LogConstants } from '@/constants/log.constant';
import { RedisConstants } from '@/constants/redis.constants';
import { Instrument } from '@/decorators/instrument.decorator';
import { AppException } from '@/exceptions/app.exception';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from '../driver/entities/driver.entity';
import { RequestResDto } from '../request/dto/request.res.dto';
import { RequestStatusEnum } from '../request/enums/request-status.enum';
import { RequestService } from '../request/request.service';
import { DriverLocationResDto } from '../tracking/dto/driver-location.res.dto';

import { MatchingService } from './matching.service';
import { OrderService } from '../order/order.service';
import { Uuid } from '@/common/types/common.type';

@Injectable()
export class DispatchService {
  constructor(
    private readonly redisLibsService: RedisLibsService,
    private readonly amqpConnection: AmqpConnection,
    private readonly requestService: RequestService,
    private readonly matchingService: MatchingService,
    private readonly orderService: OrderService,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /**
   * Main entry point: Dispatches a request to nearby drivers.
   */
  @Instrument({ performanceThreshold: 200 })
  async dispatchRequest(
    params: RequestResDto,
  ): Promise<DriverLocationResDto[]> {
    const request = await this.requestService.getRequestFromCache(params.id);
    
    // 1. Find candidates (radius check only)
    const candidates = await this.findNearbyDrivers(request);

    if (!candidates.length) {
      this.logger.warnStructured(LogConstants.REQUEST.NO_DRIVERS, {
        requestId: request.id,
      });
      return [];
    }

    // 2. Score & Filter candidates (Fairness Logic)
    // The matching service handles "filtering" of busy/incompatible drivers internally
    const scoredCandidates = await this.matchingService.findBestDrivers(request, candidates);

    if (!scoredCandidates.length) {
         this.logger.warnStructured('NO_VALID_CANDIDATES', {
            requestId: request.id,
            totalFound: candidates.length,
            reason: 'All filtered out by matching logic'
         });
         return [];
    }

    // 3. Selection Strategy:
    // For now, we pick the TOP 1 best driver.
    // In future, we could batch offer to Top 3.
    const bestMatch = scoredCandidates[0];
    const active = [{
        driverId: bestMatch.driverId,
        distanceKm: bestMatch.distanceKm
    }];

    // Note: We are NO LONGER doing the "ghost" check here because MatchingService
    // verifies metadata existence. If metadata is missing, MatchingService skips them.
    // However, we might want to clean up stale GEO index entries? 
    // MatchingService doesn't return "ghosts". 
    // We can assume if they are in Geo but not in Metadata, they are ghosts.
    // For simplicity, we skip aggressive cleanup here or move it to a background job.

    await this.markRequestDispatched(request);
    await this.emitDispatchEvent(request, active);

    this.logger.infoStructured(LogConstants.REQUEST.DISPATCH_SUCCESS, {
      requestId: request.id,
      driverCount: 1,
      driverId: bestMatch.driverId,
      score: bestMatch.score,
      debug: bestMatch.debug
    });

    return active;
  }

  /**
   * Finds nearby driver candidates using Redis geospatial query.
   */
  private async findNearbyDrivers(
    request: RequestResDto,
  ): Promise<[string, string][]> {
    try {
      return await this.redisLibsService.geoRadius(
        RedisConstants.KEYS.DRIVERS_GEO_INDEX,
        request.pickupLng,
        request.pickupLat,
        5, // Increased radius to 5km to allow better matching
        RedisConstants.CMD.UNIT_KM,
      );
    } catch (error) {
      this.logger.warnStructured(LogConstants.DRIVER.FIND_NEARBY_FAILED, {
        requestId: request.id,
        error: error.message,
      });
      throw new AppException(ErrorCode.S002, 500, error);
    }
  }

  /**
   * Marks the request as dispatched in cache/database.
   */
  private async markRequestDispatched(request: RequestResDto) {
    request.status = RequestStatusEnum.DISPATCHED;
    await this.requestService.updateRequest(request.id, request);
    this.logger.infoStructured(LogConstants.REQUEST.MARK_DISPATCHED, {
      requestId: request.id,
    });
  }

  /**
   * Emits the dispatch event.
   */
  private async emitDispatchEvent(
    request: RequestResDto,
    drivers: DriverLocationResDto[],
  ) {
    try {
      await this.amqpConnection.publish('requests', 'request.dispatched', {
        ...request,
        matchedDrivers: drivers,
        status: RequestStatusEnum.DISPATCHED,
      });
      this.logger.infoStructured(LogConstants.REQUEST.EVENT_EMITTED, {
        requestId: request.id,
      });
    } catch (error) {
      this.logger.errorStructured(LogConstants.REQUEST.EVENT_EMIT_FAILED, {
        requestId: request.id,
      });
    }
  }
  async acceptRequest(requestId: Uuid, userId: Uuid) {
    // 0. Resolve Driver Entity ID from User ID
    const driver = await this.driverRepo.findOne({ 
        where: { user: { id: userId } },
        relations: ['user']
    });
    if (!driver) {
        throw new AppException(ErrorCode.S003, 404, 'Driver profile not found');
    }
    const driverId = driver.id;

    const request = await this.requestService.getRequestFromCache(requestId);
    if (!request) {
        throw new AppException(ErrorCode.S003, 404, 'Request not found');
    }

    if (request.status !== RequestStatusEnum.DISPATCHED && request.status !== RequestStatusEnum.SEARCHING) {
        // Allow SEARCHING for testing or direct assign scenarios
        throw new AppException(ErrorCode.S003, 400, 'Request is not available for acceptance');
    }

    // Update status in Redis
    request.status = RequestStatusEnum.ACCEPTED;
    request.driverId = driverId;
    
    await this.requestService.updateRequest(requestId, request);

    // Create Order in DB
    // request.user.id currently might be string, cast to Uuid if needed
    await this.orderService.createOrder(requestId, driverId, request.user.id as Uuid);

    // Emit Event
    await this.amqpConnection.publish('requests', 'request.accepted', request);

    this.logger.infoStructured(LogConstants.REQUEST.ACCEPTED, {
        requestId,
        driverId
    });

    return { success: true };
  }
}

