import { DriverTypeEnum } from '@/api/driver/enums/driver-type.enum';
import { UserRoleEnum } from '@/api/user/enums/user-role.enum';
import { EnumField, PasswordField, StringField } from '@/decorators/field.decorators';
import { IsNotEmpty, IsPhoneNumber, ValidateIf } from 'class-validator';

/**
 * Request payload for user registration.
 * Supports both Client and Driver registration with conditional validation.
 */
export class RegisterReqDto {
  /**
   * User's mobile phone number (E.164 format).
   * @example "+213000000000"
   */
  @StringField()
  @IsPhoneNumber()
  phone!: string;

  /**
   * User's first name.
   * @example "John"
   */
  @StringField()
  firstName!: string;

  /**
   * User's last name.
   * @example "Doe"
   */
  @StringField()
  lastName!: string;

  /**
   * Account password.
   */
  @PasswordField()
  password!: string;

  /**
   * Functional role assigned to the user.
   * @default UserRoleEnum.CLIENT
   */
  @EnumField(() => UserRoleEnum, { default: UserRoleEnum.CLIENT })
  role?: UserRoleEnum;

  /**
   * Type of driver profile (Wholesale, Retail, etc.).
   * Required ONLY if the role is set to DRIVER.
   */
  @EnumField(() => DriverTypeEnum, { required: false })
  @ValidateIf((o) => o.role === UserRoleEnum.DRIVER)
  @IsNotEmpty({ message: 'Driver type is required when role is DRIVER' })
  driverType?: DriverTypeEnum;
}
