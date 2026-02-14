import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Thin wrapper over the Redis client for key-value operations.
 * Use this instead of injecting REDIS_CLIENT directly for get/set/del/exists.
 */
@Injectable()
export class RedisLibsService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  /**
   * Checks if a key exists in Redis.
   *
   * @param key - Redis key to check.
   * @returns `true` if the key exists; `false` otherwise.
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Gets the string value of a key.
   *
   * @param key - Redis key to read.
   * @returns The value, or `null` if the key does not exist.
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Sets a key to a string value, optionally with a TTL.
   *
   * @param key - Redis key to set.
   * @param value - String value to store.
   * @param ttlSeconds - Optional time-to-live in seconds (uses EX).
   */
  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds != null) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Deletes a key from Redis.
   *
   * @param key - Redis key to delete.
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Finds members in a geospatial index within a radius.
   *
   * @param key - Redis key of the geospatial index.
   * @param lng - Longitude of the center.
   * @param lat - Latitude of the center.
   * @param radius - Radius distance.
   * @param unit - Distance unit (e.g., 'km').
   * @returns Array of [member, distance] tuples.
   */
  async geoRadius(
    key: string,
    lng: number,
    lat: number,
    radius: number,
    unit: 'm' | 'km' | 'mi' | 'ft',
  ): Promise<[string, string][]> {
    return (await this.client.georadius(
      key,
      lng,
      lat,
      radius,
      unit,
      'WITHDIST',
      'ASC',
    )) as unknown as [string, string][];
  }

  /**
   * Removes members from a sorted set.
   *
   * @param key - Redis key of the sorted set.
   * @param members - Members to remove.
   */
  async zrem(key: string, ...members: string[]): Promise<void> {
    if (members.length > 0) {
      await this.client.zrem(key, ...members);
    }
  }

  /**
   * Checks existence of multiple keys using a pipeline.
   *
   * @param keys - Array of Redis keys to check.
   * @returns Array of booleans corresponding to the input keys (true if exists).
   */
  async manyExists(keys: string[]): Promise<boolean[]> {
    if (keys.length === 0) return [];

    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.exists(key));
    const results = await pipeline.exec();

    return results.map(([, result]) => result === 1);
  }
  /**
   * Sets multiple fields in a hash.
   *
   * @param key - Redis key of the hash.
   * @param data - Object containing field-value pairs.
   * @param ttlSeconds - Optional TTL for the key.
   */
  async hset(
    key: string,
    data: Record<string, string | number>,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.client.hset(key, data);
    if (ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
  }

  /**
   * Gets all fields and values from a hash.
   *
   * @param key - Redis key of the hash.
   * @returns Object containing all field-value pairs.
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /**
   * Gets values for specific fields from a hash.
   * 
   * @param key - Redis key.
   * @param fields - Fields to retrieve.
   */
  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
      return this.client.hmget(key, ...fields);
  }
}
