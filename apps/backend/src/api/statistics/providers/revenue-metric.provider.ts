import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from '../../order/entities/order.entity';
import { RequestEntity } from '../../request/entities/request.entity';
import { ProductEntity } from '../../product/entities/product.entity';
import { MetricFilters } from '../interfaces/metric-provider.interface';
import { BaseMetricProvider } from './base-metric.provider';

export interface RevenueStats {
  totalGross: number;
  averageOrderValue: number;
  trend: { date: string; amount: number }[];
}

/**
 * Provider for Revenue-related statistics.
 * Computes revenue by joining Orders, Requests, and Products.
 */
@Injectable()
export class RevenueMetricProvider extends BaseMetricProvider<RevenueStats> {
  public readonly name = 'revenue';

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {
    super();
  }

  /**
   * Computes revenue statistics based on delivered orders.
   * Note: This uses current product base price as historical prices are not persisted.
   */
  async compute(filters?: MetricFilters): Promise<RevenueStats> {
    const baseQuery = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin(RequestEntity, 'request', 'request.id = order.requestId')
      .innerJoin(ProductEntity, 'product', 'product.id = request.productId')
      .where('order.status = :status', { status: OrderStatusEnum.DELIVERED });

    this.applyDateFilters(baseQuery, filters, 'order');

    const summary = await baseQuery
      .select('SUM(product.base_price * request.volume)', 'total')
      .addSelect('AVG(product.base_price * request.volume)', 'avg')
      .getRawOne();

    const trendUnit = this.getTruncUnit(filters?.granularity);
    const trend = await baseQuery
      .select(`DATE_TRUNC('${trendUnit}', order.created_at)`, 'date')
      .addSelect('SUM(product.base_price * request.volume)', 'amount')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalGross: parseFloat(summary.total || '0'),
      averageOrderValue: parseFloat(summary.avg || '0'),
      trend: trend.map((t) => ({
        date: t.date,
        amount: parseFloat(t.amount || '0'),
      })),
    };
  }
}
