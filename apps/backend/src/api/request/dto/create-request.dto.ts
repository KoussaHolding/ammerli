import {
  EnumField,
  NumberField,
  StringFieldOptional,
  BooleanFieldOptional,
  NumberFieldOptional
} from '@/decorators/field.decorators';
import { IsOptional } from 'class-validator';
import { RequestTypeEnum } from '../enums/request-type.enum';

/**
 * Request payload for creating a new service request.
 * Contains pickup coordinates, item quantity, and service type.
 */
export class CreateRequestDto {
  /**
   * Latitude coordinate for the pickup location.
   * @example 36.7525
   */
  @NumberField({
    min: -90,
    max: 90,
    swagger: true,
    example: 36.7525,
    description: 'Latitude of the pickup location',
  })
  pickupLat!: number;

  /**
   * Longitude coordinate for the pickup location.
   * @example 3.042
   */
  @NumberField({
    min: -180,
    max: 180,
    swagger: true,
    example: 3.042,
    description: 'Longitude of the pickup location',
  })
  pickupLng!: number;

  /**
   * Quantity of units requested (e.g., volume or item count).
   * @example 5
   */
  @NumberField({
    int: true,
    isPositive: true,
    min: 1,
    max: 100,
    swagger: true,
    example: 5,
    description: 'Quantity of water units (e.g., 5L bottles)',
  })
  quantity!: number;

  /**
   * Domain-specific type of the service request.
   */
  @EnumField(() => RequestTypeEnum, {
    description: 'Type of the request',
  })
  type: RequestTypeEnum;

  /**
   * Optional instructions or delivery notes for the driver.
   * @example "Please call when you arrive"
   */
  @StringFieldOptional({
    maxLength: 200,
    swagger: true,
    example: 'Please call when you arrive',
    description: 'Additional notes for the driver',
  })
  note?: string;

  /**
   * UUID of the selected product, if applicable.
   */
  @StringFieldOptional({
    description: 'ID of the selected product',
  })
  productId?: string;

  @StringFieldOptional({ description: 'Delivery address string' })
  deliveryAddress?: string;

  @IsOptional()
  tankerDetails?: Record<string, any>;

  @IsOptional()
  bottledItems?: Record<string, any>;

  @BooleanFieldOptional({ description: 'Whether order is scheduled' })
  isScheduled?: boolean;

  @StringFieldOptional({ description: 'Scheduled date string' })
  scheduledDate?: string;

  @StringFieldOptional({ description: 'Scheduled time string' })
  scheduledTime?: string;

  @NumberFieldOptional({ description: 'Subtotal' })
  subtotal?: number;

  @NumberFieldOptional({ description: 'Delivery fee' })
  deliveryFee?: number;

  @NumberFieldOptional({ description: 'Total price' })
  totalPrice?: number;

  @StringFieldOptional({ description: 'Cancel reason' })
  cancelReason?: string;
}
