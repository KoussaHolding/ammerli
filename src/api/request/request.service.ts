import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Uuid } from '@/common/types/common.type';
import { RedisConstants } from '@/constants/redis.constants';
import { KafkaProducerService } from '@sawayo/kafka-nestjs';
import Redis from 'ioredis';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatusEnum } from './enums/request-status.enum';

@Injectable()
export class RequestService {
  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async createRequest(dto: CreateRequestDto, user: UserResDto) {
    const requestId = uuidv4() as Uuid;
    const redisKey = `${RedisConstants.KEYS.REQUESTS_INDEX}:${requestId}`;

    const existingRequest = await this.redis.get(redisKey);

    if (existingRequest) {
      return JSON.parse(existingRequest);
    }

    const requestPayload = {
      id: requestId,
      status: RequestStatusEnum.SEARCHING,
      createdAt: new Date(),
      user,
      ...dto,
    };

    await this.redis.set(redisKey, JSON.stringify(requestPayload), 'EX', 300);

    this.kafkaProducer.send({
      topic: 'request.created',
      messages: [
        {
          value: JSON.stringify(requestPayload),
        },
      ],
    });
  }
}
