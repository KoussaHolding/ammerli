import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from '../../order/entities/order.entity';
import { MetricFilters } from '../interfaces/metric-provider.interface';
import { BaseMetricProvider } from './base-metric.provider';

export interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
  fulfillmentTimeAvgMinutes: number;
  volumeTrend: { date: string; count: number }[];
}

/**
 * Provider for Order-related statistics.
 */
@Injectable()
export class OrderMetricProvider extends BaseMetricProvider<OrderStats> {
  public readonly name = 'orders';

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {
    super();
  }

  /**
   * Computes order performance metrics including volume trends and fulfillment speed.
   */
  async compute(filters?: MetricFilters): Promise<OrderStats> {
    const baseQuery = this.orderRepository.createQueryBuilder('order');
    this.applyDateFilters(baseQuery, filters, 'order');

    const [total, byStatusRaw] = await Promise.all([
      baseQuery.getCount(),
      baseQuery
        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('order.status')
        .getRawMany(),
    ]);

    const byStatus = byStatusRaw.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count, 10);
      return acc;
    }, {});

    // Fulfillment time: difference between created_at and updated_at for DELIVERED orders
    const fulfillmentQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(EXTRACT(EPOCH FROM (order.updated_at - order.created_at)) / 60)', 'avgMinutes')
      .where('order.status = :status', { status: OrderStatusEnum.DELIVERED });
    
    this.applyDateFilters(fulfillmentQuery, filters, 'order');
    const fulfillmentResult = await fulfillmentQuery.getRawOne();

    const trendUnit = this.getTruncUnit(filters?.granularity);
    const volumeTrend = await baseQuery
      .select(`DATE_TRUNC('${trendUnit}', order.created_at)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      total,
      byStatus,
      fulfillmentTimeAvgMinutes: parseFloat(fulfillmentResult.avgMinutes || '0'),
      volumeTrend: volumeTrend.map((v) => ({
        date: v.date,
        count: parseInt(v.count, 10),
      })),
    };
  }
}
