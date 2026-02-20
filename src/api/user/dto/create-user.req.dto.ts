import {
  PasswordField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { Transform } from 'class-transformer';
import { IsPhoneNumber } from 'class-validator';

/**
 * Data Transfer Object for creating a new user account.
 * Encapsulates registration fields and basic profile metadata.
 */
export class CreateUserReqDto {
  /**
   * Unique username to be used for identification.
   * Transformed to lowercase automatically.
   * @example "johndoe"
   */
  @StringField()
  @Transform(lowerCaseTransformer)
  username: string;

  /**
   * User's first name.
   * @example "John"
   */
  @StringField()
  firstName: string;

  /**
   * User's last name.
   * @example "Doe"
   */
  @StringField()
  lastName: string;

  /**
   * User's mobile phone number (E.164 format recommended).
   * @example "+1234567890"
   */
  @StringField()
  @IsPhoneNumber()
  phone: string;

  /**
   * Account password.
   * Security note: Handled via specialized PasswordField decorator for masking in swagger/logging.
   */
  @PasswordField()
  password: string;

  /**
   * Optional biography during registration.
   * @example "I love water."
   */
  @StringFieldOptional()
  bio?: string;

  /**
   * Optional initial profile image URL.
   * @example "https://example.com/profiles/avatar.png"
   */
  @StringFieldOptional()
  image?: string;
}
