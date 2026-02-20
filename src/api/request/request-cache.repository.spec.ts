import { RedisLibsService } from '@/libs/redis/redis-libs.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestResDto } from './dto/request.res.dto';
import { RequestCacheRepository } from './request-cache.repository';

// Mock specific classes if needed, but plainToInstance is a utility we actually want to test (or mock if strictly unit)
// Since plainToInstance is external lib, we can trust it, or integration test it.
// Here we are testing our usage of it.

describe('RequestCacheRepository', () => {
  let repository: RequestCacheRepository;
  let redisLibsService: jest.Mocked<RedisLibsService>;

  beforeEach(async () => {
    const redisLibsServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestCacheRepository,
        { provide: RedisLibsService, useValue: redisLibsServiceMock },
      ],
    }).compile();

    repository = module.get<RequestCacheRepository>(RequestCacheRepository);
    redisLibsService = module.get(RedisLibsService);
  });

  describe('get', () => {
    it('should return null if key does not exist', async () => {
      redisLibsService.get.mockResolvedValue(null);
      const result = await repository.get('req-1');
      expect(result).toBeNull();
    });

    it('should return null if parsing fails', async () => {
      redisLibsService.get.mockResolvedValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await repository.get('req-1');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return deserialized RequestResDto instance', async () => {
      const rawData = { id: 'req-1', status: 'SEARCHING' };
      redisLibsService.get.mockResolvedValue(JSON.stringify(rawData));

      const result = await repository.get('req-1');

      expect(result).toBeInstanceOf(RequestResDto);
      expect(result).toHaveProperty('id', 'req-1');
      expect(result).toHaveProperty('status', 'SEARCHING');
    });
  });

  describe('set', () => {
    it('should serialize and save request to redis', async () => {
      const request = new RequestResDto();
      request.id = 'req-1' as any;
      request.status = 'SEARCHING' as any;

      await repository.set(request, 100);

      expect(redisLibsService.set).toHaveBeenCalledWith(
        expect.stringContaining('req-1'),
        JSON.stringify(request),
        100,
      );
    });

    it('should use default TTL if not provided', async () => {
      const request = new RequestResDto();
      request.id = 'req-1' as any;

      await repository.set(request);

      expect(redisLibsService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        300,
      );
    });
  });

  describe('delete', () => {
    it('should delete key from redis', async () => {
      await repository.delete('req-1');
      expect(redisLibsService.del).toHaveBeenCalledWith(
        expect.stringContaining('req-1'),
      );
    });
  });
});
