import { UserEntity } from '@/api/user/entities/user.entity';
import { StringField } from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RegisterResDto {
  @Expose()
  @StringField()
  userId!: string;

  @Expose()
  user!: UserEntity;
}
