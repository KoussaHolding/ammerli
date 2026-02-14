import { RedisConstants } from '@/constants/redis.constants';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RequestResDto } from './dto/request.res.dto';

/**
 * Repository for request data cached in Redis.
 * Encapsulates key layout and get/set/delete for request cache entries.
 */
@Injectable()
export class RequestCacheRepository {
  constructor(private readonly redisLibsService: RedisLibsService) {}

  /**
   * Builds the Redis key for a request cache entry.
   *
   * @param requestId - Unique identifier of the request.
   * @returns The Redis key string.
   */
  private getKey(requestId: string): string {
    return `${RedisConstants.KEYS.REQUESTS_INDEX}:${requestId}`;
  }

  /**
   * Fetches a request from the cache.
   *
   * @param requestId - Unique identifier of the request.
   * @returns The request DTO, or `null` if not found or parse failed.
   */
  async get(requestId: string): Promise<RequestResDto | null> {
    const key = this.getKey(requestId);
    const data = await this.redisLibsService.get(key);
    if (!data) return null;

    try {
      return plainToInstance(RequestResDto, JSON.parse(data));
    } catch (error) {
      console.error(`Failed to parse request ${requestId}:`, error);
      return null;
    }
  }

  /**
   * Saves a request in the cache with an optional TTL.
   *
   * @param request - Request payload to store.
   * @param ttlSeconds - Time-to-live in seconds (default 300).
   */
  async set(request: RequestResDto, ttlSeconds = 300): Promise<void> {
    await this.redisLibsService.set(
      this.getKey(request.id),
      JSON.stringify(request),
      ttlSeconds,
    );
  }

  /**
   * Removes a request from the cache.
   *
   * @param requestId - Unique identifier of the request.
   */
  async delete(requestId: string): Promise<void> {
    await this.redisLibsService.del(this.getKey(requestId));
  }
}
