import { PasswordField } from '@/decorators/field.decorators';
import { IsPhoneNumber } from 'class-validator';

export class LoginReqDto {
  @IsPhoneNumber()
  phone!: string;

  @PasswordField()
  password!: string;
}
