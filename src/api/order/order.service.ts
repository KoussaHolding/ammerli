import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async createOrder(requestId: Uuid, driverId: Uuid, userId: Uuid) {
    const order = this.orderRepo.create({
      requestId,
      driverId,
      userId,
      status: OrderStatusEnum.CREATED,
    });
    return await this.orderRepo.save(order);
  }

  async updateStatus(requestId: Uuid, status: OrderStatusEnum) {
    // Find order by requestId since that's our link
    const order = await this.orderRepo.findOne({ where: { requestId } });
    if (order) {
      order.status = status;
      await this.orderRepo.save(order);
    }
  }
}
