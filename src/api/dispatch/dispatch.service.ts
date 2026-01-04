import { ErrorCode } from '@/constants/error-code.constant';
import { RedisConstants } from '@/constants/redis.constants';
import { Instrument } from '@/decorators/instrument.decorator';
import { AppException } from '@/exceptions/app.exception';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '@sawayo/kafka-nestjs';
import Redis from 'ioredis';
import { RequestResDto } from '../request/dto/request.res.dto';
import { RequestStatusEnum } from '../request/enums/request-status.enum';
import { RequestRepository } from '../request/request.repository';
import { DriverLocationResDto } from '../tracking/dto/driver-location.res.dto';
import { FindDriversDto } from '../tracking/dto/find-drivers.dto';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly requestRepository: RequestRepository,
  ) {}

  /**
   * Main entry point: Finds nearby drivers and initiates the dispatch process.
   */
  @Instrument({ performanceThreshold: 200 })
  async dispatchRequest(params: RequestResDto) {
    const redisKey = `${RedisConstants.KEYS.REQUESTS_INDEX}:${params.id}`;

    const request = await this.requestRepository.findById(redisKey);

    const candidates = await this.getNearbyCandidates({
      lat: request.pickupLat,
      lng: request.pickupLng,
      radiusKm: 2,
    });

    if (candidates.length === 0) {
      this.logger.log(
        `No drivers found for request at [${request.pickupLat}, ${request.pickupLng}]`,
      );
      return [];
    }

    const { active, ghosts } = await this.filterActiveDrivers(candidates);

    if (ghosts.length > 0) {
      this.removeStaleDrivers(ghosts).catch((err) =>
        this.logger.error(`Cleanup failed: ${err.message}`),
      );
    }

    if (active.length === 0) return [];

    request.status = RequestStatusEnum.DISPATCHED;

    await this.requestRepository.save(request);

    await this.emitDispatchEvents(request, active);
  }

  /**
   * Fetches raw driver IDs within the geospatial radius.
   */
  private async getNearbyCandidates(
    params: FindDriversDto,
  ): Promise<[string, string][]> {
    try {
      return (await this.redis.georadius(
        RedisConstants.KEYS.DRIVERS_GEO_INDEX,
        params.lng,
        params.lat,
        params.radiusKm,
        RedisConstants.CMD.UNIT_KM,
        RedisConstants.CMD.WITH_DIST,
        RedisConstants.CMD.SORT_ASC,
      )) as unknown as [string, string][];
    } catch (error) {
      throw new AppException(
        ErrorCode.S002,
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  /**
   * Uses a Redis pipeline to check which drivers have active session metadata.
   */
  private async filterActiveDrivers(candidates: [string, string][]) {
    const pipeline = this.redis.pipeline();
    candidates.forEach(([id]) =>
      pipeline.exists(RedisConstants.KEYS.driverMetadata(id)),
    );

    const results = await pipeline.exec();

    const active: DriverLocationResDto[] = [];
    const ghosts: string[] = [];

    candidates.forEach(([driverId, distance], index) => {
      // ioredis pipeline results format: [error, result]
      const isAlive = results[index][1] === 1;
      if (isAlive) {
        active.push({ driverId, distanceKm: parseFloat(distance) });
      } else {
        ghosts.push(driverId);
      }
    });

    return { active, ghosts };
  }

  /**
   * Centralizes the notification/event emission logic.
   */
  private async emitDispatchEvents(
    params: RequestResDto,
    drivers: DriverLocationResDto[],
  ) {
    try {
      await this.kafkaProducer.send({
        topic: 'request.dispatched',
        messages: [
          {
            key: params.id,
            value: JSON.stringify({
              searchCriteria: params,
              matchedDrivers: drivers,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (error) {
      // We log but don't necessarily block the response unless dispatch is critical
      this.logger.error(`Failed to emit dispatch event: ${error.message}`);
    }
  }

  private async removeStaleDrivers(driverIds: string[]) {
    await this.redis.zrem(RedisConstants.KEYS.DRIVERS_GEO_INDEX, ...driverIds);
  }
}
