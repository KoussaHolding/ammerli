import { UserResDto } from '@/api/user/dto/user.res.dto';
import { Uuid } from '@/common/types/common.type';
import {
  ClassField,
  EnumField,
  NumberField,
  StringField,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { RequestStatusEnum } from '../enums/request-status.enum';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { CreateRequestDto } from './create-request.dto';

/**
 * Complete response payload for a service request.
 * Contains both client-provided data and system-assigned state (id, status, driver).
 */
@Exclude()
export class RequestResDto extends CreateRequestDto {
  /**
   * Unique identifier for the request.
   * @example "uuid-v4-string"
   */
  @UUIDField()
  @Expose()
  id: Uuid;

  /**
   * Pickup latitude (inherited).
   */
  @NumberField()
  @Expose()
  declare pickupLat: number;

  /**
   * Pickup longitude (inherited).
   */
  @NumberField()
  @Expose()
  declare pickupLng: number;

  /**
   * Requested quantity (inherited).
   */
  @NumberField()
  @Expose()
  declare quantity: number;

  /**
   * Current lifecycle stage of the request.
   */
  @EnumField(() => RequestStatusEnum)
  @Expose()
  status: RequestStatusEnum;

  /**
   * Type of request (inherited).
   */
  @EnumField(() => RequestTypeEnum, {
    description: 'Type of the request',
  })
  @Expose()
  declare type: RequestTypeEnum;

  /**
   * Profile of the client who made the request.
   */
  @ClassField(() => UserResDto)
  @Expose()
  user: UserResDto;

  /**
   * UUID of the driver currently assigned to this request, if any.
   */
  @UUIDField({ nullable: true })
  @Expose()
  driverId: Uuid | null;
}
