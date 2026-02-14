import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Uuid } from '@/common/types/common.type';

export enum OrderStatusEnum {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class OrderEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: Uuid;

  @Column({ type: 'uuid' })
  requestId: Uuid;

  @Column({ type: 'uuid' })
  userId: Uuid;

  @Column({ type: 'uuid' })
  driverId: Uuid;

  @Column({
    type: 'enum',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.CREATED,
  })
  status: OrderStatusEnum;
}
