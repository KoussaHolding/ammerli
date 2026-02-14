import { RedisConstants } from '@/constants/redis.constants';
import { RedisScriptService } from '@/libs/redis/redis-script.service';
import { RedisScriptName } from '@/libs/redis/redis-scripts.registry';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/logger/logger.service';
import { DriverMetadataCacheRepository } from './driver-metadata-cache.repository';

const SCRIPT_UPDATE_LOCATION: RedisScriptName = 'UPDATE_DRIVER_LOCATION';

/**
 * Service responsible for tracking driver locations.
 *
 * Responsibilities:
 * 1. Persist driver latitude/longitude in Redis geospatial index.
 * 2. Update driver metadata (lastSeen, lat, lng) with TTL.
 * 3. Ignore stale updates (based on timestamp).
 *
 * Notes:
 * - Atomic updates are handled via a Redis Lua script.
 * - This service is lock-free; no distributed locks are required.
 * - TTL in Redis ensures that inactive drivers automatically expire.
 */
import { DriverMetadataService } from '../driver/driver-metadata.service';

@Injectable()
export class TrackingService {
  constructor(
    private readonly redisScriptService: RedisScriptService,
    private readonly driverMetadataCacheRepo: DriverMetadataCacheRepository,
    private readonly driverMetadataService: DriverMetadataService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TrackingService.name);
  }

  /**
   * Builds the Redis keys array for the location-update Lua script.
   *
   * @param driverId - Unique identifier of the driver.
   * @returns Array of key strings (GEO index and driver metadata key).
   */
  private locationUpdateKeys(driverId: string): string[] {
    return [
      RedisConstants.KEYS.DRIVERS_GEO_INDEX,
      RedisConstants.KEYS.driverMetadata(driverId),
    ];
  }

  /**
   * Builds the arguments array for the location-update Lua script.
   *
   * @param lng - Longitude.
   * @param lat - Latitude.
   * @param driverId - Unique identifier of the driver.
   * @returns Array of script arguments (lng, lat, driverId, timestamp, TTL).
   */
  private locationUpdateArgs(
    lng: number,
    lat: number,
    driverId: string,
  ): (string | number)[] {
    return [
      lng,
      lat,
      driverId,
      Date.now(),
      RedisConstants.TTL.DRIVER_METADATA_SEC,
    ];
  }

  /**
   * Updates a driver's location in Redis.
   *
   * Steps:
   * 1. Calls a Lua script to atomically:
   *    - Update GEO index
   *    - Update driver metadata hash
   *    - Refresh TTL
   * 2. Ignores updates that are older than the lastSeen timestamp.
   *
   * @param driverId - Unique identifier of the driver.
   * @param lat - Current latitude of the driver.
   * @param lng - Current longitude of the driver.
   * @returns A boolean indicating whether the update was accepted:
   *          - `true`: update persisted
   *          - `false`: stale update ignored or failed
   */
  async updateDriverLocation(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<boolean> {
    const keys = this.locationUpdateKeys(driverId);
    const args = this.locationUpdateArgs(lng, lat, driverId);

    try {
      const result = await this.redisScriptService.eval(
        SCRIPT_UPDATE_LOCATION,
        keys,
        args,
      );
      
      return result === 1;
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to update location for ${driverId}`, error.stack);
      }
      throw error; 
    }
  }

  /**
   * Checks if a driver is considered online based on Redis TTL.
   *
   * @param driverId - Unique identifier of the driver.
   * @returns `true` if driver metadata exists in Redis; `false` otherwise.
   */
  async isDriverOnline(driverId: string): Promise<boolean> {
    try {
      return await this.driverMetadataCacheRepo.isDriverOnline(driverId);
    } catch (error) {
      this.logger.error(
        `Failed to check online status for driver ${driverId}`,
        error.stack,
      );
      return false;
    }
  }
}
