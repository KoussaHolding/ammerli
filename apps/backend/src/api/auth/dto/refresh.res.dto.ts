import { NumberField, StringField } from '@/decorators/field.decorators';

/**
 * Response payload containing newly rotated tokens.
 */
export class RefreshResDto {
  /**
   * New JWT access token.
   */
  @StringField()
  accessToken!: string;

  /**
   * New rotated refresh token.
   */
  @StringField()
  refreshToken!: string;

  /**
   * Expiry timestamp for the new access token.
   * @example 1771192435
   */
  @NumberField()
  tokenExpires!: number;
}
