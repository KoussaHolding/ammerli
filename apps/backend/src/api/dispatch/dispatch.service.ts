import { ErrorMessageConstants } from '@/constants/error-code.constant';
import { LogConstants } from '@/constants/log.constant';
import { RedisConstants } from '@/constants/redis.constants';
import { Instrument } from '@/decorators/instrument.decorator';
import { AppException } from '@/exceptions/app.exception';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from 'src/logger/logger.service';
import { Repository } from 'typeorm';
import { DriverEntity } from '../driver/entities/driver.entity';
import { RequestResDto } from '../request/dto/request.res.dto';
import { RequestStatusEnum } from '../request/enums/request-status.enum';
import { RequestService } from '../request/request.service';
import { DriverLocationResDto } from '../tracking/dto/driver-location.res.dto';

import { Uuid } from '@/common/types/common.type';
import { MatchingService } from './matching.service';

/**
 * Service responsible for orchestrating the dispatch of requests to drivers.
 * Implements the core business logic for finding nearby candidates, scoring them
 * via MatchingService, and managing the request acceptance flow.
 *
 * @class DispatchService
 */
@Injectable()
export class DispatchService {
  constructor(
    private readonly redisLibsService: RedisLibsService,
    private readonly amqpConnection: AmqpConnection,
    private readonly requestService: RequestService,
    private readonly matchingService: MatchingService,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /**
   * Main dispatching pipeline.
   * Finds, scores, and offers a request to the best available driver.
   *
   * @param params - The request data to be dispatched
   * @returns Array of driver identifiers that received the dispatch offer
   *
   * @example
   * const results = await dispatchService.dispatchRequest(activeRequest);
   */
  @Instrument({ performanceThreshold: 200 })
  async dispatchRequest(
    params: RequestResDto,
  ): Promise<DriverLocationResDto[]> {
    const request = await this.requestService.getRequestFromCache(params.id);

    const candidates = await this.findNearbyDrivers(request);

    if (!candidates.length) {
      this.logger.warnStructured(LogConstants.REQUEST.NO_DRIVERS, {
        requestId: request.id,
      });
      return [];
    }

    const scoredCandidates = await this.matchingService.findBestDrivers(
      request,
      candidates,
    );

    if (!scoredCandidates.length) {
      this.logger.warnStructured(LogConstants.REQUEST.NO_DRIVERS, {
        requestId: request.id,
        totalFound: candidates.length,
        reason: ErrorMessageConstants.REQUEST.NOT_AVAILABLE,
      });
      return [];
    }

    const bestMatch = scoredCandidates[0];
    const active = [
      {
        driverId: bestMatch.driverId,
        distanceKm: bestMatch.distanceKm,
      },
    ];

    await this.markRequestDispatched(request);
    await this.emitDispatchEvent(request, active);

    this.logger.infoStructured(LogConstants.REQUEST.DISPATCH_SUCCESS, {
      requestId: request.id,
      driverCount: 1,
      driverId: bestMatch.driverId,
      score: bestMatch.score,
      debug: bestMatch.debug,
    });

    return active;
  }

  /**
   * Finds nearby driver candidates using Redis geospatial query.
   * @private
   */
  private async findNearbyDrivers(
    request: RequestResDto,
  ): Promise<[string, string][]> {
    try {
      return await this.redisLibsService.geoRadius(
        RedisConstants.KEYS.DRIVERS_GEO_INDEX,
        request.pickupLng,
        request.pickupLat,
        5,
        RedisConstants.CMD.UNIT_KM,
      );
    } catch (error) {
      this.logger.warnStructured(LogConstants.DRIVER.FIND_NEARBY_FAILED, {
        requestId: request.id,
        error: error.message,
      });
      throw new AppException(ErrorMessageConstants.SYSTEM.REDIS_FAILURE, 500);
    }
  }

  /**
   * Marks the request as dispatched in the cache.
   * @private
   */
  private async markRequestDispatched(request: RequestResDto) {
    request.status = RequestStatusEnum.DISPATCHED;
    await this.requestService.updateRequest(request.id, request);
    this.logger.infoStructured(LogConstants.REQUEST.MARK_DISPATCHED, {
      requestId: request.id,
    });
  }

  /**
   * Publishes the 'request.dispatched' event to RabbitMQ.
   * @private
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
  /**
   * Accepts a dispatch offer on behalf of a driver.
   * Transitions request to ACCEPTED, assigns driver, and creates the associated Order.
   *
   * @param requestId - Request being accepted
   * @param userId - ID of the User (Driver) who is accepting
   * @returns Success confirmation
   * @throws {AppException} If driver or request not found, or request is no longer available
   */
  async acceptRequest(requestId: Uuid, userId: Uuid) {
    const driver = await this.driverRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!driver) {
      this.logger.error(`${LogConstants.DRIVER.NOT_FOUND}: ${userId}`);
      throw new AppException(ErrorMessageConstants.DRIVER.NOT_FOUND, 404);
    }
    const driverId = driver.id;

    const request = await this.requestService.getRequestFromCache(requestId);
    if (!request) {
      throw new AppException(ErrorMessageConstants.REQUEST.NOT_FOUND, 404);
    }

    if (
      request.status !== RequestStatusEnum.DISPATCHED &&
      request.status !== RequestStatusEnum.SEARCHING
    ) {
      throw new AppException(ErrorMessageConstants.REQUEST.NOT_AVAILABLE, 400);
    }

    request.status = RequestStatusEnum.ACCEPTED;
    request.driverId = driverId;


    await this.requestService.updateRequest(requestId, request);

    await this.amqpConnection.publish('requests', 'request.accepted', request);

    this.logger.infoStructured(LogConstants.REQUEST.ACCEPTED, {
      requestId,
      driverId,
    });

    return { success: true };
  }

  /**
   * Records a driver's explicit refusal of a dispatch offer.
   * Transitions request back to SEARCHING and adds driver to the refusal list.
   *
   * @param requestId - ID of the request being refused
   * @param userId - ID of the User (Driver) who is refusing
   * @returns Success confirmation
   * @throws {AppException} If driver or request not found, or request is not in a valid state
   */
  async refuseRequest(requestId: Uuid, userId: Uuid) {
    const driver = await this.driverRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!driver) {
      throw new AppException(ErrorMessageConstants.DRIVER.NOT_FOUND, 404);
    }

    const request = await this.requestService.getRequestFromCache(requestId);
    if (!request) {
      throw new AppException(ErrorMessageConstants.REQUEST.NOT_FOUND, 404);
    }

    // Refusal is only valid if request is still being matched or specifically offered
    if (
      request.status !== RequestStatusEnum.DISPATCHED &&
      request.status !== RequestStatusEnum.SEARCHING
    ) {
      throw new AppException(ErrorMessageConstants.REQUEST.NOT_AVAILABLE, 400);
    }

    // Initialize refusedDrivers if it doesn't exist (safety)
    if (!request.refusedDrivers) {
      request.refusedDrivers = [];
    }

    // Add driver to refused list if not already present
    if (!request.refusedDrivers.includes(driver.id)) {
      request.refusedDrivers.push(driver.id);
    }

    // Transition back to SEARCHING so matching loop can re-evaluate
    request.status = RequestStatusEnum.SEARCHING;

    await this.requestService.updateRequest(requestId, request);

    // Emit event for potential tracking/logging consumers
    await this.amqpConnection.publish('requests', 'request.refused', {
      requestId,
      driverId: driver.id,
    });

    this.logger.infoStructured(LogConstants.REQUEST.CANCELLED, {
      requestId,
      driverId: driver.id,
      reason: 'Driver Refused',
    });

    return { success: true };
  }
}
