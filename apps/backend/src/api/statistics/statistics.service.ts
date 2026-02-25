import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IMetricProvider, MetricFilters } from './interfaces/metric-provider.interface';
import { UserMetricProvider } from './providers/user-metric.provider';
import { OrderMetricProvider } from './providers/order-metric.provider';
import { RevenueMetricProvider } from './providers/revenue-metric.provider';
import { StatisticsQueryDto } from './dtos/statistics-query.dto';

/**
 * Service orchestrating the computation of various system statistics.
 * Uses a Strategy-based approach with specialized Metric Providers.
 */
@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);
  private readonly providers: IMetricProvider[];
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'stats:';

  constructor(
    private readonly userProvider: UserMetricProvider,
    private readonly orderProvider: OrderMetricProvider,
    private readonly revenueProvider: RevenueMetricProvider,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.providers = [this.userProvider, this.orderProvider, this.revenueProvider];
  }

  /**
   * Aggregates all registered metrics into a single dashboard summary.
   * Leverages caching (1 hour) to reduce DB load.
   * 
   * @param query - Filtering and granularity options.
   * @returns A consolidated object containing all metrics.
   */
  async getDashboardSummary(query: StatisticsQueryDto): Promise<Record<string, any>> {
    const cacheKey = `${this.CACHE_PREFIX}dashboard:${JSON.stringify(query)}`;
    const cachedData = await this.cacheManager.get<Record<string, any>>(cacheKey);

    if (cachedData) {
      this.logger.debug(`Returning cached dashboard summary for key: ${cacheKey}`);
      return cachedData;
    }

    this.logger.log(`Generating dashboard summary with filters: ${JSON.stringify(query)}`);

    const filters: MetricFilters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      granularity: query.granularity,
    };

    const results = await Promise.all(
      this.providers.map(async (provider) => ({
        [provider.name]: await provider.compute(filters),
      })),
    );

    const data = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    
    await this.cacheManager.set(cacheKey, data, this.CACHE_TTL * 1000);
    return data;
  }

  /**
   * Retrieves a specific metric by its provider name.
   * Leverages caching (1 hour).
   * 
   * @param name - The name of the metric provider (e.g., 'users', 'revenue').
   * @param query - Filtering options.
   * @returns the computed metric for the provider.
   * @throws {Error} if provider is not found.
   */
  async getMetricByName(name: string, query: StatisticsQueryDto): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}report:${name}:${JSON.stringify(query)}`;
    const cachedData = await this.cacheManager.get<any>(cacheKey);

    if (cachedData) {
      this.logger.debug(`Returning cached report for ${name}: ${cacheKey}`);
      return cachedData;
    }

    const provider = this.providers.find((p) => p.name === name);
    if (!provider) {
      throw new Error(`Metric provider '${name}' not found`);
    }

    const filters: MetricFilters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      granularity: query.granularity,
    };

    const data = await provider.compute(filters);
    
    await this.cacheManager.set(cacheKey, data, this.CACHE_TTL * 1000);
    return data;
  }

  /**
   * Clears all statistics-related cache entries.
   */
  async clearCache(): Promise<void> {
    this.logger.log('Invalidating all statistics cache entries...');
    // Note: cache-manager-ioredis-yet supports store specific methods.
    // For simplicity with standard Cache interface, we clear known keys or use store methods if available.
    if ('store' in this.cacheManager && (this.cacheManager as any).store.keys) {
      const keys = await (this.cacheManager as any).store.keys(`${this.CACHE_PREFIX}*`);
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    } else {
        // Fallback for stores that don't support keys() - though ioredis-yet should.
        // We could also just reset the whole cache if it's dedicated to statistics, 
        // but it's global. So we'll try to be selective.
        this.logger.warn('Cache store does not support wildcard deletion; performing full cache reset if applicable or skipping.');
    }
  }
}
