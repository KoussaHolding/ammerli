import { PasswordField, StringField } from '@/decorators/field.decorators';
import { IsPhoneNumber } from 'class-validator';

/**
 * Request payload for phone-based login.
 */
export class LoginReqDto {
  /**
   * User's registered phone number.
   * @example "+213000000000"
   */
  @IsPhoneNumber()
  @StringField()
  phone!: string;

  /**
   * Account password.
   */
  @PasswordField()
  password!: string;
}
