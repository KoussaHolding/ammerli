import { TokenField } from '@/decorators/field.decorators';

/**
 * Request payload for refreshing access tokens.
 */
export class RefreshReqDto {
  /**
   * Valid refresh token provided during login or previous refresh.
   */
  @TokenField()
  refreshToken!: string;
}
