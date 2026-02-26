import { Uuid } from '@/common/types/common.type';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppLogger } from 'src/logger/logger.service';
import { OrderService } from '../order/order.service';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestEntity } from './entities/request.entity';
import { RequestStatusEnum } from './enums/request-status.enum';
import { RequestCacheRepository } from './request-cache.repository';
import { RequestService } from './request.service';
import { ErrorMessageConstants } from '@/constants/error-code.constant';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('RequestService', () => {
  let service: RequestService;
  let amqpConnection: jest.Mocked<AmqpConnection>;
  let cacheRepo: jest.Mocked<RequestCacheRepository>;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(async () => {
    const amqpConnectionMock = {
      publish: jest.fn(),
    };
    const cacheRepoMock = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      setUserActiveRequest: jest.fn(),
      removeUserActiveRequest: jest.fn(),
      getUserActiveRequest: jest.fn(),
    };
    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn(),
      infoStructured: jest.fn(),
      warnStructured: jest.fn(),
      errorStructured: jest.fn(),
      debugStructured: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        { provide: AmqpConnection, useValue: amqpConnectionMock },
        { provide: RequestCacheRepository, useValue: cacheRepoMock },
        { provide: AppLogger, useValue: loggerMock },
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn() },
        },
        { provide: OrderService, useValue: { updateStatus: jest.fn() } },
        { provide: 'REDLOCK_CLIENT', useValue: { using: jest.fn((keys, ttl, cb) => cb()) } },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    amqpConnection = module.get(AmqpConnection);
    cacheRepo = module.get(RequestCacheRepository);
    logger = module.get(AppLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    const createRequestDto: CreateRequestDto = {
      pickupLocation: { lat: 10, lng: 20 },
      destinationLocation: { lat: 30, lng: 40 },
    } as any; // Cast as any for brevity if needed
    const user: UserResDto = { id: 'user-1' as Uuid } as any;

    // Mock uuid generation? Not directly possible without mock factory or manual mock of uuid module.
    // Or we can just check structure of result.

    it('should return existing request if found in cache', async () => {
      const existingRequest = { id: 'existing-id' as Uuid } as any;
      cacheRepo.get.mockResolvedValue(existingRequest);

      const result = await service.createRequest(user.id, createRequestDto, user);

      expect(result).toBe(existingRequest);
      expect(cacheRepo.set).not.toHaveBeenCalled();
      expect(amqpConnection.publish).not.toHaveBeenCalled();
    });

    it('should create new request, save to cache, and publish event', async () => {
      cacheRepo.get.mockResolvedValue(null);

      const result = await service.createRequest(user.id, createRequestDto, user);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe(RequestStatusEnum.SEARCHING);
      expect(result.user).toBe(user);

      expect(cacheRepo.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          status: RequestStatusEnum.SEARCHING,
        }),
        300,
      );
      expect(amqpConnection.publish).toHaveBeenCalledWith(
        'requests',
        'request.created',
        expect.objectContaining({
          id: expect.any(String),
          status: RequestStatusEnum.SEARCHING,
        }),
      );
    });

    it("should return active request if findActiveRequest returns one (idempotency)", async () => {
      const activeRequest = { id: "active-id" as Uuid } as any;
      cacheRepo.getUserActiveRequest.mockResolvedValue("active-id" as Uuid);
      cacheRepo.get.mockResolvedValue(activeRequest);

      const result = await service.createRequest(user.id, createRequestDto, user);

      expect(result).toBe(activeRequest);
      expect(cacheRepo.getUserActiveRequest).toHaveBeenCalledWith(user.id);
      expect(cacheRepo.set).not.toHaveBeenCalled();
    });
  });

  describe('getRequestFromCache', () => {
    it('should return request from repository', async () => {
      const request = { id: 'req-1' } as any;
      cacheRepo.get.mockResolvedValue(request);

      const result = await service.getRequestFromCache('req-1');
      expect(result).toBe(request);
      expect(cacheRepo.get).toHaveBeenCalledWith('req-1');
    });
  });

  describe('setRequestInCache', () => {
    it('should call repository set with default TTL', async () => {
      const request = { id: 'req-1' } as any;
      await service.setRequestInCache(request);
      expect(cacheRepo.set).toHaveBeenCalledWith(request, 300);
    });

    it('should call repository set with custom TTL', async () => {
      const request = { id: 'req-1' } as any;
      await service.setRequestInCache(request, 600);
      expect(cacheRepo.set).toHaveBeenCalledWith(request, 600);
    });
  });

  describe('updateRequest', () => {
    it('should throw error if request not found', async () => {
      cacheRepo.get.mockResolvedValue(null);

      await expect(service.updateRequest('req-1', {})).rejects.toThrow(
        ErrorMessageConstants.REQUEST.ID_NOT_FOUND,
      );
    });

    it('should update request and save to cache', async () => {
      const existing = {
        id: 'req-1',
        status: RequestStatusEnum.SEARCHING,
      } as any;
      cacheRepo.get.mockResolvedValue(existing);

      const updates = { status: RequestStatusEnum.ACCEPTED };
      const result = await service.updateRequest('req-1', updates);

      expect(result.status).toBe(RequestStatusEnum.ACCEPTED);
      expect(cacheRepo.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'req-1',
          status: RequestStatusEnum.ACCEPTED,
        }),
        300,
      );
    });
  });

  describe('deleteRequestFromCache', () => {
    it('should call repository delete', async () => {
      await service.deleteRequestFromCache('req-1');
      expect(cacheRepo.delete).toHaveBeenCalledWith('req-1');
    });
  });
});
