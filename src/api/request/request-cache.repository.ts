import { RedisConstants } from '@/constants/redis.constants';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import Redis from 'ioredis';
import { RequestResDto } from './dto/request.res.dto';

@Injectable()
export class RequestCacheRepository {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private getKey(requestId: string): string {
    return `${RedisConstants.KEYS.REQUESTS_INDEX}:${requestId}`;
  }

  async get(requestId: string): Promise<RequestResDto | null> {
    const key = this.getKey(requestId);
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return plainToInstance(RequestResDto, JSON.parse(data));
    } catch (error) {
      console.error(`Failed to parse request ${requestId}:`, error);
      return null;
    }
  }

  async set(request: RequestResDto, ttlSeconds = 300): Promise<void> {
    await this.redis.set(
      this.getKey(request.id),
      JSON.stringify(request),
      'EX',
      ttlSeconds,
    );
  }

  async delete(requestId: string): Promise<void> {
    await this.redis.del(this.getKey(requestId));
  }
}
