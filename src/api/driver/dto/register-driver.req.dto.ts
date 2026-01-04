import { RegisterReqDto } from '@/api/auth/dto/register.req.dto';
import { EnumField } from '@/decorators/field.decorators';
import { DriverTypeEnum } from '../enums/driver-type.enum';

export class RegisterDriverReqDto extends RegisterReqDto {
  @EnumField(() => DriverTypeEnum, {
    description: 'Type of the driver',
  })
  type: DriverTypeEnum;
}
