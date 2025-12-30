import { ErrorCode } from '@/constants/error-code.constant';
import { RedisConstants } from '@/constants/redis.constants';
import { Instrument } from '@/decorators/instrument.decorator';
import { AppException } from '@/exceptions/app.exception';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { DriverLocationResDto } from '../tracking/dto/driver-location.res.dto';
import { FindDriversDto } from '../tracking/dto/find-drivers.dto';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Orchestrates the discovery of active drivers.
   *
   * @param params - The geospatial search parameters (lat, lng, radius).
   * @returns A list of active drivers with their distances.
   */
  @Instrument({ performanceThreshold: 150 })
  async findDrivers(params: FindDriversDto): Promise<DriverLocationResDto[]> {
    const candidates = await this.getRawCandidates(params);

    if (candidates.length === 0) return [];

    const { active, ghosts } = await this.classifyDrivers(candidates);

    if (ghosts.length > 0) {
      this.cleanupGhosts(ghosts).catch((err) => {
        this.logger.error(`Background cleanup failed: ${err.message}`);
      });
    }

    return active;
  }

  /**
   * Executes the raw Redis GEORADIUS query to find all potential keys in the area.
   *
   * @param params - The search boundaries.
   * @returns A raw list of driver IDs and distances from Redis.
   * @throws {AppException} If the Redis query fails.
   */
  private async getRawCandidates(
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
   * Separates active drivers from stale ones by checking for metadata existence.
   *
   * @param candidates - The raw list of [driverId, distance] tuples.
   * @returns An object containing the list of active DTOs and a list of stale driver IDs.
   */
  @Instrument()
  private async classifyDrivers(candidates: [string, string][]) {
    const pipeline = this.redis.pipeline();

    candidates.forEach(([driverId]) => {
      pipeline.exists(RedisConstants.KEYS.driverMetadata(driverId));
    });

    const results = await pipeline.exec();

    const active: DriverLocationResDto[] = [];
    const ghosts: string[] = [];

    candidates.forEach(([driverId, distance], index) => {
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
   * Removes stale driver keys from the geospatial index.
   * This runs as a fire-and-forget background task.
   *
   * @param driverIds - The list of driver IDs to remove.
   */
  @Instrument()
  private async cleanupGhosts(driverIds: string[]) {
    await this.redis.zrem(RedisConstants.KEYS.DRIVERS_GEO_INDEX, ...driverIds);
  }
}
