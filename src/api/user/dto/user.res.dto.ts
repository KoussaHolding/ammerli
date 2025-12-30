import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  phone: string;

  @StringField()
  @Expose()
  firstName: string;

  @StringField()
  @Expose()
  lastName: string;

  @StringFieldOptional()
  @Expose()
  bio?: string;

  @StringField()
  @Expose()
  image?: string;

  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;
}
