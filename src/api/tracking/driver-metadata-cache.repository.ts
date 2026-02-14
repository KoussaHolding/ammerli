import { RedisConstants } from '@/constants/redis.constants';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { Injectable } from '@nestjs/common';

/**
 * Repository for driver metadata cached in Redis.
 * Encapsulates key layout and online-status checks for drivers.
 */
@Injectable()
export class DriverMetadataCacheRepository {
  constructor(private readonly redisLibsService: RedisLibsService) {}

  /**
   * Builds the Redis key for a driver's metadata.
   *
   * @param driverId - Unique identifier of the driver.
   * @returns The Redis key string.
   */
  private getKey(driverId: string): string {
    return RedisConstants.KEYS.driverMetadata(driverId);
  }

  /**
   * Checks if a driver is considered online (metadata key exists in Redis).
   *
   * @param driverId - Unique identifier of the driver.
   * @returns `true` if the driver metadata exists; `false` otherwise.
   */
  async isDriverOnline(driverId: string): Promise<boolean> {
    return this.redisLibsService.exists(this.getKey(driverId));
  }
}
