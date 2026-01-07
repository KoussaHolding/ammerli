import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Uuid } from '@/common/types/common.type';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResDto } from './dto/request.res.dto';
import { RequestStatusEnum } from './enums/request-status.enum';
import { RequestCacheRepository } from './request-cache.repository';

@Injectable()
export class RequestService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly cacheRepo: RequestCacheRepository,
  ) {}

  /**
   * Creates a new request.
   *
   * Steps:
   * 1. Checks Redis cache for existing request.
   * 2. Saves request in Redis cache with TTL.
   * 3. Sends 'request.created' event via Kafka.
   *
   * @param dto - Request creation data
   * @param user - User creating the request
   * @returns The created request payload
   */
  async createRequest(
    dto: CreateRequestDto,
    user: UserResDto,
  ): Promise<RequestResDto> {
    const requestId = uuidv4() as Uuid;

    const existing = await this.getRequestFromCache(requestId);
    if (existing) return existing;

    const payload: RequestResDto = {
      id: requestId,
      status: RequestStatusEnum.SEARCHING,
      user,
      ...dto,
    };

    await this.setRequestInCache(payload, 300);

    await this.amqpConnection.publish('requests', 'request.created', payload);

    return payload;
  }

  /**
   * Fetches a request from Redis cache.
   *
   * @param requestId - Unique request identifier
   * @returns Request from cache, or null if not found
   */
  async getRequestFromCache(requestId: string): Promise<RequestResDto | null> {
    return this.cacheRepo.get(requestId);
  }

  /**
   * Saves a request in Redis cache.
   *
   * @param request - Request to save
   * @param ttlSeconds - Time-to-live in seconds (default 300)
   */
  async setRequestInCache(
    request: RequestResDto,
    ttlSeconds = 300,
  ): Promise<void> {
    await this.cacheRepo.set(request, ttlSeconds);
  }

  /**
   * Updates an existing request in cache.
   *
   * Steps:
   * 1. Fetches the request from Redis cache.
   * 2. Merges the provided updates into the existing request.
   * 3. Saves the updated request back to Redis cache.
   *
   * @param requestId - Unique identifier of the request to update
   * @param updates - Partial fields of the request to update
   * @param emitEvent - Whether to emit a 'request.updated' Kafka event (default: true)
   * @returns The updated request payload
   * @throws Error if the request does not exist in cache
   */
  async updateRequest(
    requestId: string,
    updates: Partial<RequestResDto>,
  ): Promise<RequestResDto> {
    const existing = await this.getRequestFromCache(requestId);

    if (!existing) {
      throw new Error(`Request with ID ${requestId} not found`);
    }

    const updated: RequestResDto = { ...existing, ...updates };

    await this.setRequestInCache(updated, 300);

    return updated;
  }

  /**
   * Deletes a request from Redis cache.
   *
   * @param requestId - Unique request identifier
   */
  async deleteRequestFromCache(requestId: string): Promise<void> {
    await this.cacheRepo.delete(requestId);
  }
}
