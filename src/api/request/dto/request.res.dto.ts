import { UserResDto } from '@/api/user/dto/user.res.dto';
import { ClassField, StringField } from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RequestResDto {
  @StringField()
  @Expose()
  pickupLat: number;

  @StringField()
  @Expose()
  pickupLng: number;

  @StringField()
  @Expose()
  waterQuantity: number;

  @ClassField(() => UserResDto)
  @Expose()
  user: UserResDto;
}
