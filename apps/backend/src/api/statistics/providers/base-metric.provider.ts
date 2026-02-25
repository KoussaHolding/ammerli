import { SelectQueryBuilder } from 'typeorm';
import { IMetricProvider, MetricFilters } from '../interfaces/metric-provider.interface';

/**
 * Base abstract class for all metric providers.
 * Provides shared utilities for query building and date normalization.
 */
export abstract class BaseMetricProvider<T = any> implements IMetricProvider<T> {
  public abstract readonly name: string;

  /**
   * Abstract compute method to be implemented by child classes.
   */
  public abstract compute(filters?: MetricFilters): Promise<T>;

  /**
   * Applies common date filters to a query builder.
   * 
   * @param query - The TypeORM SelectQueryBuilder instance.
   * @param filters - The filters to apply.
   * @param alias - The entity alias in the query.
   * @returns The modified query builder.
   */
  protected applyDateFilters<E>(
    query: SelectQueryBuilder<E>,
    filters?: MetricFilters,
    alias: string = 'entity',
  ): SelectQueryBuilder<E> {
    if (!filters) return query;

    if (filters.startDate) {
      query.andWhere(`${alias}.created_at >= :startDate`, {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere(`${alias}.created_at <= :endDate`, {
        endDate: filters.endDate,
      });
    }

    return query;
  }

  /**
   * Maps granularity to SQL date_trunc units.
   */
  protected getTruncUnit(granularity?: string): string {
    switch (granularity) {
      case 'hourly':
        return 'hour';
      case 'daily':
        return 'day';
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      default:
        return 'day';
    }
  }
}
