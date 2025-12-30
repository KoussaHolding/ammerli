import { RedisConstants } from '@/constants/redis.constants';
import { Instrument } from '@/decorators/instrument.decorator';
import { UseDistributedLock } from '@/libs/redis/decorators/lock.decorator';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly redisClient: any;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('REDLOCK_CLIENT') private readonly redlock: Redlock,
  ) {}

  /**
   * Persists the driver's current location and refreshes their "Online" status.
   * This method is debounced using a distributed lock to prevent write-storms.
   *
   * @param driverId - Unique identifier of the driver.
   * @param lat - Latitude.
   * @param lng - Longitude.
   */
  @UseDistributedLock({
    key: RedisConstants.KEYS.LOCK_DRIVER_UPDATE_PATTERN,
    ttl: RedisConstants.TTL.LOCK_DRIVER_UPDATE_MS,
    failStrategy: 'SKIP',
  })
  @Instrument({ logArgs: false })
  async updateDriverLocation(driverId: string, lat: number, lng: number) {
    const timestamp = Date.now();

    await this.persistLocationState(
      driverId,
      lat,
      lng,
      timestamp,
      RedisConstants.TTL.DRIVER_METADATA_SEC,
    );
  }

  /**
   * atomic execution of Geo-Index update and Metadata refresh.
   * Uses a Redis Pipeline to reduce network round-trips.
   */
  private async persistLocationState(
    driverId: string,
    lat: number,
    lng: number,
    timestamp: number,
    ttl: number,
  ) {
    const metadataKey = RedisConstants.KEYS.driverMetadata(driverId);
    const geoKey = RedisConstants.KEYS.DRIVERS_GEO_INDEX;

    const pipeline = this.redis.pipeline();

    pipeline.geoadd(geoKey, lng, lat, driverId);
    pipeline.hset(metadataKey, { lastSeen: timestamp, lat, lng });
    pipeline.expire(metadataKey, ttl);

    await pipeline.exec();
  }
}
