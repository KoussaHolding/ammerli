import { ErrorCode } from '@/constants/error-code.constant';
import { RedisConstants } from '@/constants/redis.constants';
import { Instrument } from '@/decorators/instrument.decorator';
import { AppException } from '@/exceptions/app.exception';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { AppLogger } from 'src/logger/logger.service';
import { RequestResDto } from '../request/dto/request.res.dto';
import { RequestStatusEnum } from '../request/enums/request-status.enum';
import { RequestService } from '../request/request.service';
import { DriverLocationResDto } from '../tracking/dto/driver-location.res.dto';

@Injectable()
export class DispatchService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly amqpConnection: AmqpConnection,
    private readonly requestService: RequestService,
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
    const candidates = await this.findNearbyDrivers(request);

    if (!candidates.length) {
      this.logger.warn(
        `No drivers found for request at [${request.pickupLat}, ${request.pickupLng}]`,
      );
      return [];
    }

    const { active, ghosts } = await this.filterActiveDrivers(candidates);

    if (ghosts.length) await this.removeStaleDrivers(ghosts);

    if (!active.length) return [];

    await this.markRequestDispatched(request);
    await this.emitDispatchEvent(request, active);

    this.logger.log(
      `Request ${request.id} dispatched to ${active.length} drivers`,
    );

    return active;
  }

  /**
   * Finds nearby driver candidates using Redis geospatial query.
   */
  private async findNearbyDrivers(
    request: RequestResDto,
  ): Promise<[string, string][]> {
    try {
      return (await this.redis.georadius(
        RedisConstants.KEYS.DRIVERS_GEO_INDEX,
        request.pickupLng,
        request.pickupLat,
        2,
        RedisConstants.CMD.UNIT_KM,
        RedisConstants.CMD.WITH_DIST,
        RedisConstants.CMD.SORT_ASC,
      )) as unknown as [string, string][];
    } catch (error) {
      this.logger.error(
        `Failed to find nearby drivers: ${error.message}`,
        error.stack,
      );
      throw new AppException(ErrorCode.S002, error.status || 500, error);
    }
  }

  /**
   * Filters candidates into active drivers and stale (ghost) drivers.
   */
  private async filterActiveDrivers(candidates: [string, string][]) {
    if (!candidates.length) return { active: [], ghosts: [] };

    const pipeline = this.redis.pipeline();
    candidates.forEach(([id]) =>
      pipeline.exists(RedisConstants.KEYS.driverMetadata(id)),
    );

    const results = await pipeline.exec();

    const active: DriverLocationResDto[] = [];
    const ghosts: string[] = [];

    candidates.forEach(([driverId, distance], index) => {
      const isAlive = results[index][1] === 1;
      if (isAlive) active.push({ driverId, distanceKm: parseFloat(distance) });
      else ghosts.push(driverId);
    });

    this.logger.debug(
      `Filtered ${active.length} active drivers, ${ghosts.length} stale drivers`,
    );

    return { active, ghosts };
  }

  /**
   * Marks the request as dispatched in cache/database.
   */
  private async markRequestDispatched(request: RequestResDto) {
    request.status = RequestStatusEnum.DISPATCHED;
    await this.requestService.updateRequest(request.id, request);
    this.logger.log(`Request ${request.id} marked as DISPATCHED`);
  }

  /**
   * Emits the dispatch event to Kafka.
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
      this.logger.log(`Kafka dispatch event sent for request ${request.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to emit dispatch event for request ${request.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Removes stale drivers from Redis geospatial index.
   */
  private async removeStaleDrivers(driverIds: string[]) {
    try {
      await this.redis.zrem(
        RedisConstants.KEYS.DRIVERS_GEO_INDEX,
        ...driverIds,
      );
      this.logger.log(`Removed ${driverIds.length} stale drivers from Redis`);
    } catch (error) {
      this.logger.error(
        `Failed to remove stale drivers: ${error.message}`,
        error.stack,
      );
    }
  }
}
