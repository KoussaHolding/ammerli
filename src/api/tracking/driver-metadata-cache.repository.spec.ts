import { RedisConstants } from '@/constants/redis.constants';
import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DriverMetadataCacheRepository } from './driver-metadata-cache.repository';

describe('DriverMetadataCacheRepository', () => {
  let repository: DriverMetadataCacheRepository;
  let redisLibsService: jest.Mocked<RedisLibsService>;

  beforeEach(async () => {
    const redisLibsServiceMock = {
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverMetadataCacheRepository,
        { provide: RedisLibsService, useValue: redisLibsServiceMock },
      ],
    }).compile();

    repository = module.get<DriverMetadataCacheRepository>(
      DriverMetadataCacheRepository,
    );
    redisLibsService = module.get(RedisLibsService);
  });

  describe('isDriverOnline', () => {
    it('should return true if key exists', async () => {
      redisLibsService.exists.mockResolvedValue(true);
      const result = await repository.isDriverOnline('driver-1');
      expect(result).toBe(true);
      expect(redisLibsService.exists).toHaveBeenCalledWith(
        RedisConstants.KEYS.driverMetadata('driver-1'),
      );
    });

    it('should return false if key does not exist', async () => {
      redisLibsService.exists.mockResolvedValue(false);
      const result = await repository.isDriverOnline('driver-1');
      expect(result).toBe(false);
    });
  });
});
