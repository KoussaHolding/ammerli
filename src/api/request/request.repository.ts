import { RedisConstants } from '@/constants/redis.constants';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import Redis from 'ioredis';
import { RequestResDto } from './dto/request.res.dto';

@Injectable()
export class RequestRepository {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async findById(requestId: string): Promise<RequestResDto | null> {
    const data = await this.redis.get(requestId);
    if (!data) return null;

    return plainToInstance(RequestResDto, JSON.parse(data));
  }

  async save(request: RequestResDto): Promise<void> {
    await this.redis.set(
      `${RedisConstants.KEYS.REQUESTS_INDEX}:${request.id}`,
      JSON.stringify(request),
      'EX',
      300,
    );
  }
}
