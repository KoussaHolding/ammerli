import { ErrorCode } from '@/constants/error-code.constant';
import { LogConstants } from '@/constants/log.constant';
import { RedisConstants } from '@/constants/redis.constants';
import { AppException } from '@/exceptions/app.exception';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from 'src/logger/logger.service';
import { RequestResDto } from '../request/dto/request.res.dto';
import { RequestStatusEnum } from '../request/enums/request-status.enum';
import { RequestService } from '../request/request.service';
import { DispatchService } from './dispatch.service';
import { MatchingService } from './matching.service';

// Mock UUID to avoid issues
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('DispatchService', () => {
    let service: DispatchService;
    let redisLibsService: jest.Mocked<RedisLibsService>;
    let amqpConnection: jest.Mocked<AmqpConnection>;
    let requestService: jest.Mocked<RequestService>;
    let matchingService: jest.Mocked<MatchingService>;
    let logger: jest.Mocked<AppLogger>;

    beforeEach(async () => {
        const redisLibsServiceMock = {
            geoRadius: jest.fn(),
            manyExists: jest.fn(),
            zrem: jest.fn(),
        };
        const amqpConnectionMock = {
            publish: jest.fn(),
        };
        const requestServiceMock = {
            getRequestFromCache: jest.fn(),
            updateRequest: jest.fn(),
        };
        const matchingServiceMock = {
            findBestDrivers: jest.fn(),
        };
        const loggerMock = {
            setContext: jest.fn(),
            infoStructured: jest.fn(),
            warnStructured: jest.fn(),
            errorStructured: jest.fn(),
            debugStructured: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DispatchService,
                { provide: RedisLibsService, useValue: redisLibsServiceMock },
                { provide: AmqpConnection, useValue: amqpConnectionMock },
                { provide: RequestService, useValue: requestServiceMock },
                { provide: MatchingService, useValue: matchingServiceMock },
                { provide: AppLogger, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<DispatchService>(DispatchService);
        redisLibsService = module.get(RedisLibsService);
        amqpConnection = module.get(AmqpConnection);
        requestService = module.get(RequestService);
        matchingService = module.get(MatchingService);
        logger = module.get(AppLogger);
    });

    describe('dispatchRequest', () => {
        const requestId = 'req-1';
        const requestDto: RequestResDto = {
            id: requestId,
            pickupLat: 10,
            pickupLng: 20,
            status: RequestStatusEnum.SEARCHING,
        } as any;

        beforeEach(() => {
            requestService.getRequestFromCache.mockResolvedValue(requestDto);
        });

        it('should return empty and warn if no nearby drivers found', async () => {
            redisLibsService.geoRadius.mockResolvedValue([]);

            const result = await service.dispatchRequest(requestDto);

            expect(result).toEqual([]);
            expect(logger.warnStructured).toHaveBeenCalledWith(
                LogConstants.REQUEST.NO_DRIVERS,
                expect.anything(),
            );
        });

        it('should return empty if MatchingService filters all candidates', async () => {
            // Found nearby drivers
            redisLibsService.geoRadius.mockResolvedValue([['d1', '0.5']]);
            // But matching service returns empty (e.g. all busy)
            matchingService.findBestDrivers.mockResolvedValue([]);

            const result = await service.dispatchRequest(requestDto);

            expect(result).toEqual([]);
            expect(logger.warnStructured).toHaveBeenCalledWith(
                'NO_VALID_CANDIDATES',
                expect.anything()
            );
        });

        it('should dispatch to the BEST driver selected by MatchingService', async () => {
             redisLibsService.geoRadius.mockResolvedValue([['d1', '0.5'], ['d2', '1.0']]);
             
             // MatchingService returns d2 as best (e.g. better rating/idle time)
             matchingService.findBestDrivers.mockResolvedValue([{
                 driverId: 'd2',
                 score: 0.9,
                 distanceKm: 1.0,
                 metadata: {} as any,
                 debug: {}
             }]);

             const result = await service.dispatchRequest(requestDto);

             expect(result).toHaveLength(1);
             expect(result[0].driverId).toBe('d2');
             
             // Verify request update
             expect(requestService.updateRequest).toHaveBeenCalledWith(
                 requestId,
                 expect.objectContaining({ status: RequestStatusEnum.DISPATCHED })
             );

             // Verify event emission
             expect(amqpConnection.publish).toHaveBeenCalledWith(
                 'requests',
                 'request.dispatched',
                 expect.objectContaining({
                     id: requestId,
                     matchedDrivers: expect.arrayContaining([
                         expect.objectContaining({ driverId: 'd2' })
                     ])
                 })
             );
        });
    });
});
