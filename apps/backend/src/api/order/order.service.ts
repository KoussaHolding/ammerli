import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from './entities/order.entity';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ListOrderReqDto } from './dto/list-order.req.dto';
import { OrderResDto } from './dto/order.res.dto';
import { plainToInstance } from 'class-transformer';
import { paginate } from '@/utils/offset-pagination';
import { applyFiltersToQueryBuilder } from '@/utils/query-filter.util';


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

  async findAll(
    reqDto: ListOrderReqDto,
  ): Promise<OffsetPaginatedDto<OrderResDto>> {
    const query = this.orderRepo.createQueryBuilder('order');
    
    // Applying dynamic filtering, no search columns as order entity only has primitives.
    applyFiltersToQueryBuilder(query, reqDto);

    query.orderBy('order.createdAt', 'DESC');

    const [orders, metaDto] = await paginate<OrderEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(
      plainToInstance(OrderResDto, orders),
      metaDto,
    );
  }
}

