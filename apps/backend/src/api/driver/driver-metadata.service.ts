import { RedisConstants } from '@/constants/redis.constants';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { Injectable } from '@nestjs/common';

export interface DriverMetadata {
  driverId: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  lastJobTimestamp: number;
  dailyJobCount: number;
  vehicleType?: string;
  rating: number;
  lat?: number;
  lng?: number;
}

@Injectable()
export class DriverMetadataService {
  constructor(private readonly redisLibsService: RedisLibsService) {}

  private getKey(driverId: string): string {
    return RedisConstants.KEYS.driverMetadata(driverId);
  }

  /**
   * Updates specific fields of a driver's metadata.
   */
  async updateMetadata(
    driverId: string,
    data: Partial<DriverMetadata>,
  ): Promise<void> {
    const key = this.getKey(driverId);
    // Convert all values to strings/numbers safe for Redis
    const payload: Record<string, string | number> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) payload[k] = v;
    });

    await this.redisLibsService.hset(
      key,
      payload,
      RedisConstants.TTL.DRIVER_METADATA_SEC,
    );
  }

  /**
   * Retrieves full metadata for a driver.
   */
  async getMetadata(driverId: string): Promise<DriverMetadata | null> {
    const data = await this.redisLibsService.hgetall(this.getKey(driverId));
    if (!data || Object.keys(data).length === 0) return null;

    return {
      driverId,
      status: (data.status as any) || 'OFFLINE',
      lastJobTimestamp: parseInt(data.lastJobTimestamp || '0', 10),
      dailyJobCount: parseInt(data.dailyJobCount || '0', 10),
      vehicleType: data.vehicleType,
      rating: parseFloat(data.rating || '5.0'),
      lat: data.lat ? parseFloat(data.lat) : undefined,
      lng: data.lng ? parseFloat(data.lng) : undefined,
    };
  }

  /**
   * Retrieves metadata for multiple drivers efficiently (using pipeline if needed).
   * Note: For now, we do parallel calls, but pipeline is better for scale.
   */
  async getMetadataForDrivers(driverIds: string[]): Promise<DriverMetadata[]> {
    const promises = driverIds.map((id) => this.getMetadata(id));
    const results = await Promise.all(promises);
    return results.filter((r) => r !== null) as DriverMetadata[];
  }
}
