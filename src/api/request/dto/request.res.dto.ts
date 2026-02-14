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

@Exclude()
export class RequestResDto {
  @UUIDField()
  @Expose()
  id: Uuid;

  @NumberField()
  @Expose()
  pickupLat: number;

  @NumberField()
  @Expose()
  pickupLng: number;

  @NumberField()
  @Expose()
  quantity: number;

  @EnumField(() => RequestStatusEnum)
  @Expose()
  status: RequestStatusEnum;

  @EnumField(() => RequestTypeEnum, {
    description: 'Type of the request',
  })
  @Expose()
  type: RequestTypeEnum;

  @ClassField(() => UserResDto)
  @Expose()
  user: UserResDto;

  @UUIDField({ nullable: true })
  @Expose()
  driverId: Uuid | null;
}
