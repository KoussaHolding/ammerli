import { PasswordField, StringField } from '@/decorators/field.decorators';
import { IsPhoneNumber } from 'class-validator';

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
}
