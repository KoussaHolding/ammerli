import { SelectQueryBuilder } from 'typeorm';

/**
 * Interface for all Metric Providers.
 * Each provider is responsible for computing a specific domain of statistics.
 */
export interface IMetricProvider<T = any> {
  /**
   * Unique name of the provider.
   */
  readonly name: string;

  /**
   * Computes the metric based on optional filters.
   * 
   * @param filters - Optional date range and granularity filters.
   * @returns A promise resolving to the computed metric data.
   */
  compute(filters?: MetricFilters): Promise<T>;
}

/**
 * Common filters for all statistics queries.
 */
export interface MetricFilters {
  startDate?: Date;
  endDate?: Date;
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}
