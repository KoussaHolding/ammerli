import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from 'src/logger/logger.service';
import {
  DriverMetadata,
  DriverMetadataService,
} from '../driver/driver-metadata.service';
import { RequestResDto } from '../request/dto/request.res.dto';
import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let driverMetadataService: jest.Mocked<DriverMetadataService>;

  beforeEach(async () => {
    const driverMetadataServiceMock = {
      getMetadataForDrivers: jest.fn(),
    };
    const loggerMock = {
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: DriverMetadataService, useValue: driverMetadataServiceMock },
        { provide: AppLogger, useValue: loggerMock },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    driverMetadataService = module.get(DriverMetadataService);
  });

  describe('findBestDrivers', () => {
    const request: RequestResDto = { id: 'req-1' } as any;

    it('should return empty if no candidates', async () => {
      const result = await service.findBestDrivers(request, []);
      expect(result).toEqual([]);
    });

    it('should score drivers based on distance and idle time', async () => {
      const candidates: [string, string][] = [
        ['d1', '1.0'], // Close, but recently active
        ['d2', '5.0'], // Far, but idle for long time
      ];

      const now = Date.now();
      const metadata: DriverMetadata[] = [
        {
          driverId: 'd1',
          status: 'AVAILABLE',
          lastJobTimestamp: now - 1000 * 60, // 1 min ago
          dailyJobCount: 5,
          rating: 5.0,
        },
        {
          driverId: 'd2',
          status: 'AVAILABLE',
          lastJobTimestamp: now - 1000 * 3600, // 1 hour ago
          dailyJobCount: 0,
          rating: 5.0,
        },
      ];

      driverMetadataService.getMetadataForDrivers.mockResolvedValue(metadata);

      const result = await service.findBestDrivers(request, candidates);

      expect(result).toHaveLength(2);
      // d2 should likely win due to IDLE_TIME and DAILY_BALANCE weights
      // d1 score: Dist(high) + Idle(low) + Bal(low)
      // d2 score: Dist(low) + Idle(high) + Bal(high)

      const d1 = result.find((r) => r.driverId === 'd1');
      const d2 = result.find((r) => r.driverId === 'd2');

      console.log('D1 Score:', d1?.score);
      console.log('D2 Score:', d2?.score);

      // In this specific weighted setup:
      // W_DIST=0.4, W_IDLE=0.3, W_BAL=0.2
      // d1 dist=1/5 -> 4/5 score. Idle=small. Bal=0.
      // d2 dist=5/5 -> 0 score. Idle=big. Bal=1.
      // D2 should win if weights favor fairness.

      expect(result[0].driverId).toBe('d2');
    });

    it('should filter out BUSY drivers', async () => {
      const candidates: [string, string][] = [['d1', '1.0']];
      const metadata: DriverMetadata[] = [
        {
          driverId: 'd1',
          status: 'BUSY', // NOT AVAILABLE
          lastJobTimestamp: 0,
          dailyJobCount: 0,
          rating: 5.0,
        },
      ];
      driverMetadataService.getMetadataForDrivers.mockResolvedValue(metadata);

      const result = await service.findBestDrivers(request, candidates);
      expect(result).toHaveLength(0);
    });

    it('should filter out drivers who have explicitly refused the request', async () => {
      const requestId = 'req-1';
      const requestWithRefusals: RequestResDto = {
        id: requestId,
        refusedDrivers: ['d1'],
      } as any;

      const candidates: [string, string][] = [
        ['d1', '1.0'],
        ['d2', '2.0'],
      ];

      const metadata: DriverMetadata[] = [
        {
          driverId: 'd1',
          status: 'AVAILABLE',
          lastJobTimestamp: 0,
          dailyJobCount: 0,
          rating: 5.0,
        },
        {
          driverId: 'd2',
          status: 'AVAILABLE',
          lastJobTimestamp: 0,
          dailyJobCount: 0,
          rating: 5.0,
        },
      ];

      driverMetadataService.getMetadataForDrivers.mockResolvedValue(metadata);

      const result = await service.findBestDrivers(
        requestWithRefusals,
        candidates,
      );

      expect(result).toHaveLength(1);
      expect(result[0].driverId).toBe('d2');
    });
  });
});
