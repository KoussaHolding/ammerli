import { UpdateUserReqDto } from '@/api/user/dto/update-user.req.dto';
import { EnumField } from '@/decorators/field.decorators';
import { DriverTypeEnum } from '../enums/driver-type.enum';

export class UpdateDriverReqDto extends UpdateUserReqDto {
  @EnumField(() => DriverTypeEnum, {
    description: 'Type of the driver',
  })
  type: DriverTypeEnum;
}
