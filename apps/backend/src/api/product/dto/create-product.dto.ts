import {
  BooleanFieldOptional,
  NumberField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CreateProductDto {
  @StringField({ minLength: 3, maxLength: 50 })
  name!: string;

  @StringFieldOptional({ maxLength: 255 })
  description?: string;

  @NumberField({ min: 1, int: true })
  capacityLiters!: number;

  @NumberField({ min: 0 })
  basePrice!: number;

  @NumberField({ min: 0 })
  pricePerKm!: number;

  @BooleanFieldOptional()
  isActive?: boolean;
}
