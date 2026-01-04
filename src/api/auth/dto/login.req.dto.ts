import { PasswordField, StringField } from '@/decorators/field.decorators';
import { IsPhoneNumber } from 'class-validator';

export class LoginReqDto {
  @IsPhoneNumber()
  @StringField()
  phone!: string;

  @PasswordField()
  password!: string;
}
