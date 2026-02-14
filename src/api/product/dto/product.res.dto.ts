import { Uuid } from '@/common/types/common.type';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProductResDto {
  @Expose()
  id!: Uuid;

  @Expose()
  name!: string;

  @Expose()
  description?: string;

  @Expose()
  capacityLiters!: number;

  @Expose()
  basePrice!: number;

  @Expose()
  pricePerKm!: number;

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
