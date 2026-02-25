import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { UserMetricProvider } from './providers/user-metric.provider';
import { OrderMetricProvider } from './providers/order-metric.provider';
import { RevenueMetricProvider } from './providers/revenue-metric.provider';
import { StatisticsQueryDto } from './dtos/statistics-query.dto';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let userProvider: UserMetricProvider;
  let orderProvider: OrderMetricProvider;
  let revenueProvider: RevenueMetricProvider;

  const mockUserProvider = {
    name: 'users',
    compute: jest.fn().mockResolvedValue({ total: 10, byRole: {}, growth: [] }),
  };

  const mockOrderProvider = {
    name: 'orders',
    compute: jest.fn().mockResolvedValue({ total: 5, byStatus: {}, fulfillmentTimeAvgMinutes: 20, volumeTrend: [] }),
  };

  const mockRevenueProvider = {
    name: 'revenue',
    compute: jest.fn().mockResolvedValue({ totalGross: 1000, averageOrderValue: 200, trend: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: UserMetricProvider, useValue: mockUserProvider },
        { provide: OrderMetricProvider, useValue: mockOrderProvider },
        { provide: RevenueMetricProvider, useValue: mockRevenueProvider },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    userProvider = module.get<UserMetricProvider>(UserMetricProvider);
    orderProvider = module.get<OrderMetricProvider>(OrderMetricProvider);
    revenueProvider = module.get<RevenueMetricProvider>(RevenueMetricProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should aggregate data from all providers', async () => {
      const query: StatisticsQueryDto = { granularity: 'daily' };
      const result = await service.getDashboardSummary(query);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('revenue');
      expect(userProvider.compute).toHaveBeenCalled();
      expect(orderProvider.compute).toHaveBeenCalled();
      expect(revenueProvider.compute).toHaveBeenCalled();
    });

    it('should pass filters to providers', async () => {
      const query: StatisticsQueryDto = { 
        startDate: '2023-01-01', 
        endDate: '2023-01-31', 
        granularity: 'monthly' 
      };
      await service.getDashboardSummary(query);

      const expectedFilters = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        granularity: 'monthly',
      };

      expect(userProvider.compute).toHaveBeenCalledWith(expectedFilters);
    });
  });

  describe('getMetricByName', () => {
    it('should return metric from specific provider', async () => {
      const query: StatisticsQueryDto = { granularity: 'daily' };
      const result = await service.getMetricByName('revenue', query);

      expect(result).toEqual({ totalGross: 1000, averageOrderValue: 200, trend: [] });
      expect(revenueProvider.compute).toHaveBeenCalled();
    });

    it('should throw error if provider not found', async () => {
      const query: StatisticsQueryDto = { granularity: 'daily' };
      await expect(service.getMetricByName('invalid', query)).rejects.toThrow(
        "Metric provider 'invalid' not found"
      );
    });
  });
});
