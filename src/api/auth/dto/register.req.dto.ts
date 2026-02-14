import { DriverTypeEnum } from '@/api/driver/enums/driver-type.enum';
import { UserRoleEnum } from '@/api/user/enums/user-role.enum';
import { EnumField, PasswordField, StringField } from '@/decorators/field.decorators';
import { IsNotEmpty, IsPhoneNumber, ValidateIf } from 'class-validator';

export class RegisterReqDto {
  @StringField()
  @IsPhoneNumber()
  phone!: string;

  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @PasswordField()
  password!: string;

  @EnumField(() => UserRoleEnum, { default: UserRoleEnum.CLIENT })
  role?: UserRoleEnum;

  @EnumField(() => DriverTypeEnum, { required: false })
  @ValidateIf((o) => o.role === UserRoleEnum.DRIVER)
  @IsNotEmpty({ message: 'Driver type is required when role is DRIVER' })
  driverType?: DriverTypeEnum;
}
