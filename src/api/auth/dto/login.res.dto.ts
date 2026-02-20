import { StringField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserEntity } from '../../user/entities/user.entity';

/**
 * Response payload for successful login.
 * Includes authentication tokens and the user's profile details.
 */
@Exclude()
export class LoginResDto {
  /**
   * Unique identifier of the user who logged in.
   * @example "uuid-v4-string"
   */
  @Expose()
  @StringField()
  userId!: string;

  /**
   * JWT access token for authorization.
   */
  @Expose()
  @StringField()
  accessToken!: string;

  /**
   * Epoch timestamp when the access token will expire.
   * @example 1771192435
   */
  @Expose()
  @ApiProperty({
    type: String,
    example: 1771192435,
  })
  tokenExpires!: number;

  /**
   * The complete user entity profile.
   */
  @Expose()
  @ApiProperty({
    type: UserEntity,
  })
  user!: UserEntity;
}
