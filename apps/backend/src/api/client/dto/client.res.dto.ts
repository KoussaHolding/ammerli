import { Exclude, Expose } from 'class-transformer';

import { UserResDto } from '@/api/user/dto/user.res.dto';
import { ClassField, StringField } from '@/decorators/field.decorators';

@Exclude()
export class ClientResDto {
  @StringField()
  @Expose()
  id: string;

  @ClassField(() => UserResDto)
  @Expose()
  user: UserResDto;
}
