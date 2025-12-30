import {
  NumberField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CreateRequestDto {
  @NumberField({
    min: -90,
    max: 90,
    swagger: true,
    example: 36.7525,
    description: 'Latitude of the pickup location',
  })
  pickupLat!: number;

  @NumberField({
    min: -180,
    max: 180,
    swagger: true,
    example: 3.042,
    description: 'Longitude of the pickup location',
  })
  pickupLng!: number;

  @NumberField({
    int: true,
    isPositive: true,
    min: 1,
    max: 100,
    swagger: true,
    example: 5,
    description: 'Quantity of water units (e.g., 5L bottles)',
  })
  waterQuantity!: number;

  @StringFieldOptional({
    maxLength: 200,
    swagger: true,
    example: 'Please call when you arrive',
    description: 'Additional notes for the driver',
  })
  note?: string;
}
