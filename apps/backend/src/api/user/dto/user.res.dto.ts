import {
  ClassField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

/**
 * Data Transfer Object for user profile responses.
 * Contains public-facing user information and system timestamps.
 */
@Exclude()
export class UserResDto {
  /**
   * Unique identifier (UUID) of the user.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @StringField()
  @Expose()
  id: string;

  /**
   * User's verified phone number.
   * @example "+1234567890"
   */
  @StringField()
  @Expose()
  phone: string;

  /**
   * User's first name.
   * @example "John"
   */
  @StringField()
  @Expose()
  firstName: string;

  /**
   * User's last name.
   * @example "Doe"
   */
  @StringField()
  @Expose()
  lastName: string;

  /**
   * Optional short biography or profile description.
   * @example "Software Engineer with a passion for clean code."
   */
  @StringFieldOptional()
  @Expose()
  bio?: string;

  /**
   * Optional URL to the user's profile image or avatar.
   * @example "https://example.com/profiles/johndoe.png"
   */
  @StringField()
  @Expose()
  image?: string;

  /**
   * Timestamp when the user account was created.
   */
  @ClassField(() => Date)
  @Expose()
  createdAt: Date;

  /**
   * Timestamp when the user profile was last updated.
   */
  @ClassField(() => Date)
  @Expose()
  updatedAt: Date;
}
