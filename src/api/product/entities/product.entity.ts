import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class ProductEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_product_id' })
  id!: Uuid;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'capacity_liters', type: 'int' })
  capacityLiters!: number;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ name: 'price_per_km', type: 'decimal', precision: 10, scale: 2 })
  pricePerKm!: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
