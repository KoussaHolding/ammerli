import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { OrderStatusEnum } from '../entities/order.entity';

export class OrderResDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  requestId: Uuid;

  @ApiProperty()
  @Expose()
  userId: Uuid;

  @ApiProperty()
  @Expose()
  driverId: Uuid;

  @ApiProperty({ enum: OrderStatusEnum })
  @Expose()
  status: OrderStatusEnum;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
