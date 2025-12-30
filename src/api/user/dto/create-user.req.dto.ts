import {
  PasswordField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { Transform } from 'class-transformer';
import { IsPhoneNumber } from 'class-validator';

export class CreateUserReqDto {
  @StringField()
  @Transform(lowerCaseTransformer)
  username: string;

  @StringField()
  firstName: string;

  @StringField()
  lastName: string;

  @StringField()
  @IsPhoneNumber()
  phone: string;

  @PasswordField()
  password: string;

  @StringFieldOptional()
  bio?: string;

  @StringFieldOptional()
  image?: string;
}
