import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { MetricFilters } from '../interfaces/metric-provider.interface';
import { BaseMetricProvider } from './base-metric.provider';

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
  growth: { date: string; count: number }[];
}

/**
 * Provider for User-related statistics.
 */
@Injectable()
export class UserMetricProvider extends BaseMetricProvider<UserStats> {
  public readonly name = 'users';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  /**
   * Computes user statistics including total count, role distribution, and growth trends.
   */
  async compute(filters?: MetricFilters): Promise<UserStats> {
    const totalQuery = this.userRepository.createQueryBuilder('user');
    this.applyDateFilters(totalQuery, filters, 'user');

    const [total, byRoleRaw] = await Promise.all([
      totalQuery.getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .groupBy('user.role')
        .getRawMany(),
    ]);

    const byRole = byRoleRaw.reduce((acc, curr) => {
      acc[curr.role] = parseInt(curr.count, 10);
      return acc;
    }, {});

    const trendUnit = this.getTruncUnit(filters?.granularity);
    const growth = await this.userRepository
      .createQueryBuilder('user')
      .select(`DATE_TRUNC('${trendUnit}', user.created_at)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.created_at IS NOT NULL')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      total,
      byRole,
      growth: growth.map((g) => ({
        date: g.date,
        count: parseInt(g.count, 10),
      })),
    };
  }
}
