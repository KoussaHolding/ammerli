import { Inject, Injectable } from '@nestjs/common';
import Redlock from 'redlock';
import { v4 as uuidv4 } from 'uuid';
import { UseDistributedLock } from '@/libs/redis/decorators/lock.decorator';

import { Uuid } from '@/common/types/common.type';
import { ErrorMessageConstants } from '@/constants/error-code.constant';
import { LogConstants } from '@/constants/log.constant';
import {
  RabbitMqExchange,
  RabbitMqRoutingKey,
} from '@/libs/rabbitMq/domain-events';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AppLogger } from 'src/logger/logger.service';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResDto } from './dto/request.res.dto';
import { RequestStatusEnum } from './enums/request-status.enum';
import { RequestCacheRepository } from './request-cache.repository';
import { ListRequestReqDto } from './dto/list-request.req.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { plainToInstance } from 'class-transformer';
import { paginate } from '@/utils/offset-pagination';
import { applyFiltersToQueryBuilder } from '@/utils/query-filter.util';


import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RequestEntity } from './entities/request.entity';

/**
 * Service managing the lifecycle of customer requests.
 * Handles temporary storage in Redis for live requests and persistent storage in Postgres
 * for finalized requests. Orchestrates event-driven communication via RabbitMQ.
 *
 * @class RequestService
 */
@Injectable()
export class RequestService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly cacheRepo: RequestCacheRepository,
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @Inject('REDLOCK_CLIENT') private readonly redlock: Redlock,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RequestService.name);
  }

  /**
   * Initializes a new customer request in the system.
   * Caches the request in Redis for immediate availability and publishes creation events.
   *
   * @param dto - Request details (pickup coordinates, quantity, product)
   * @param user - Authenticated user creating the request
   * @returns Initialized request payload
   *
   * @example
   * const request = await requestService.createRequest(createDto, currentUser);
   */
  @UseDistributedLock({ key: 'locks:request:create:{0}', ttl: 5000 })
  async createRequest(
    userId: string,
    dto: CreateRequestDto,
    user: UserResDto,
  ): Promise<RequestResDto> {
    const active = await this.findActiveRequest(userId as Uuid);
    if (active) {
      this.logger.log(`Returning active request for user ${userId}: ${active.id}`);
      return active;
    }

    const requestId = uuidv4() as Uuid;

    const existing = await this.getRequestFromCache(requestId);
    if (existing) return existing;

    const payload: RequestResDto = {
      id: requestId,
      status: RequestStatusEnum.SEARCHING,
      user,
      driverId: null,
      ...dto,
    };

    this.logger.log(`${LogConstants.REQUEST.RECEIVED}: ${payload.id}`);
    await this.setRequestInCache(payload, 300);
    await this.cacheRepo.setUserActiveRequest(user.id, payload.id, 300);

    await this.amqpConnection.publish(
      RabbitMqExchange.REQUESTS,
      RabbitMqRoutingKey.REQUEST_CREATED,
      payload,
    );

    return payload;
  }

  /**
   * Retrieves a paginated list of persisted requests.
   * Note: Active requests stored only in Redis cache won't appear here until persisted or synced.
   */
  async findAll(
    reqDto: ListRequestReqDto,
  ): Promise<OffsetPaginatedDto<RequestResDto>> {
    const query = this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.driver', 'driver')
      .leftJoinAndSelect('request.product', 'product')
      .orderBy('request.createdAt', 'DESC');

    applyFiltersToQueryBuilder(query, reqDto, {
      searchColumns: [
        'user.firstName',
        'user.lastName',
        'user.email',
        'driver.firstName',
        'driver.lastName',
      ],
    });

    const [requests, metaDto] = await paginate<RequestEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(
      plainToInstance(RequestResDto, requests),
      metaDto,
    );
  }



  /**
   * Retrieves a live request from the Redis cache.
   *
   * @param requestId - Unique request identifier
   * @returns Request payload if active, otherwise null
   */
  async getRequestFromCache(requestId: string): Promise<RequestResDto | null> {
    return this.cacheRepo.get(requestId);
  }

  /**
   * Sets or refreshes a request in the Redis cache.
   *
   * @param request - Request payload to persist
   * @param ttlSeconds - Time-to-live in seconds (default: 300)
   */
  async setRequestInCache(
    request: RequestResDto,
    ttlSeconds = 300,
  ): Promise<void> {
    await this.cacheRepo.set(request, ttlSeconds);
  }

  /**
   * Updates an active request in the cache.
   * Merges provided updates with existing cached data.
   *
   * @param requestId - Target request identifier
   * @param updates - Partial fields to update
   * @returns Fully updated request payload
   * @throws {Error} If request is not found in cache
   */
  async updateRequest(
    requestId: string,
    updates: Partial<RequestResDto>,
  ): Promise<RequestResDto> {
    const existing = await this.getRequestFromCache(requestId);

    if (!existing) {
      throw new Error(ErrorMessageConstants.REQUEST.ID_NOT_FOUND);
    }

    const updated: RequestResDto = { ...existing, ...updates };

    await this.setRequestInCache(updated, 300);

    return updated;
  }

  /**
   * Explicitly removes a request from the Redis cache.
   *
   * @param requestId - Request identifier to purge
   */
  async deleteRequestFromCache(requestId: string): Promise<void> {
    await this.cacheRepo.delete(requestId);
  }

  /**
   * Transition a request to a terminal state and persists it to permanent storage.
   * Also orchestrates associated Order status updates and publishes final domain events.
   *
   * @param requestId - Request identifier
   * @param status - Final status (COMPLETED, CANCELLED, EXPIRED)
   * @returns The finalized request data
   * @throws {Error} If request not found in cache
   */
  async finalizeRequest(requestId: string, status: RequestStatusEnum) {
    const request = await this.getRequestFromCache(requestId);
    if (!request) {
      throw new Error(ErrorMessageConstants.REQUEST.NOT_FOUND);
    }

    request.status = status;
    await this.setRequestInCache(request, 60);

    const requestEntity = this.requestRepo.create({
      id: request.id as Uuid,
      status: status,
      userId: request.user?.id as Uuid,
      driverId: request.driverId ? (request.driverId as Uuid) : null,
      volume: request.quantity,
      pickupLat: request.pickupLat,
      pickupLng: request.pickupLng,
      productId: request.productId ? (request.productId as Uuid) : null,
    });

    await this.requestRepo.save(requestEntity);


    const routingKeyMap: Partial<Record<RequestStatusEnum, string>> = {
      [RequestStatusEnum.ACCEPTED]: RabbitMqRoutingKey.REQUEST_ACCEPTED,
      [RequestStatusEnum.ARRIVED]: RabbitMqRoutingKey.DRIVER_ARRIVED,
      [RequestStatusEnum.IN_PROGRESS]: RabbitMqRoutingKey.RIDE_STARTED,
      [RequestStatusEnum.COMPLETED]: RabbitMqRoutingKey.RIDE_COMPLETED,
      [RequestStatusEnum.CANCELLED]: RabbitMqRoutingKey.REQUEST_CANCELLED,
      [RequestStatusEnum.EXPIRED]: RabbitMqRoutingKey.REQUEST_CANCELLED,
    };

    const routingKey = routingKeyMap[status];

    if (routingKey) {
      await this.amqpConnection.publish(
        RabbitMqExchange.REQUESTS,
        routingKey,
        request,
      );
    }

    if (
      status === RequestStatusEnum.COMPLETED ||
      status === RequestStatusEnum.CANCELLED ||
      status === RequestStatusEnum.EXPIRED
    ) {
      if (request.user?.id) {
        await this.cacheRepo.removeUserActiveRequest(request.user.id);
      }
    }

    return request;
  }

  /**
   * Finds the currently active request for a specific user.
   * Checks Redis for transient states (SEARCHING) and Postgres for active states (ACCEPTED, etc.).
   *
   * @param userId - Target user identifier
   * @returns Active request payload or null if none found
   */
  async findActiveRequest(userId: Uuid): Promise<RequestResDto | null> {
    const cachedRequestId = await this.cacheRepo.getUserActiveRequest(userId);
    if (cachedRequestId) {
      const cachedRequest = await this.getRequestFromCache(cachedRequestId);
      if (cachedRequest) return cachedRequest;
    }

    const activeStatus = [
      RequestStatusEnum.ACCEPTED,
      RequestStatusEnum.ARRIVED,
      RequestStatusEnum.IN_PROGRESS,
    ];

    const request = await this.requestRepo.findOne({
      where: {
        userId,
        status: In(activeStatus),
      },
      relations: ['driver', 'user'],
    });

    if (!request) return null;

    return {
      id: request.id,
      status: request.status,
      user: request.user ? { ...request.user } : null,
      driverId: request.driverId,
      quantity: request.volume,
      pickupLat: request.pickupLat || 0,
      pickupLng: request.pickupLng || 0,
      productId: request.productId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    } as unknown as RequestResDto;
  }
}
