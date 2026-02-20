import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { RefreshReqDto } from './dto/refresh.req.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { RegisterReqDto } from './dto/register.req.dto';
import { RegisterResDto } from './dto/register.res.dto';
import { JwtPayloadType } from './types/jwt-payload.type';

/**
 * Controller manages authentication flows including login, registration, and token management.
 * Provides public endpoints for identity assertion and secure endpoints for session termination.
 *
 * @version 1
 * @tag auth
 */
@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * authenticates a user via phone number and password.
   *
   * @param userLogin - Login credentials (phone, password)
   * @returns JWT access and refresh tokens upon successful authentication
   */
  @ApiPublic({
    type: LoginResDto,
    summary: 'Sign in',
  })
  @Post('phone/login')
  async signIn(@Body() userLogin: LoginReqDto): Promise<LoginResDto> {
    return await this.authService.signIn(userLogin);
  }

  /**
   * Registers a new user account (Client or Driver).
   * Automatically creates the associated profile based on the selected role.
   *
   * @param dto - Registration data including role-specific driver details
   * @returns Detailed registration confirmation
   */
  @ApiPublic()
  @Post('phone/register')
  @ApiBody({
    type: RegisterReqDto,
    examples: {
      client: {
        summary: 'Client Registration',
        value: {
          phone: '+213000000000',
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123',
          role: 'CLIENT',
        },
      },
      driver: {
        summary: 'Driver Registration',
        value: {
          phone: '+213000000000',
          firstName: 'Jane',
          lastName: 'Doe',
          password: 'password123',
          role: 'DRIVER',
          driverType: 'WHOLESALE',
        },
      },
    },
  })
  async register(@Body() dto: RegisterReqDto): Promise<RegisterResDto> {
    return await this.authService.register(dto);
  }

  /**
   * Terminates the current user session and blacklists the token.
   *
   * @param userToken - Current validated JWT payload
   * @returns Empty response on success
   */
  @ApiAuth({
    summary: 'Logout',
    errorResponses: [400, 401, 403, 500],
  })
  @Post('logout')
  async logout(@CurrentUser() userToken: JwtPayloadType): Promise<void> {
    await this.authService.logout(userToken);
  }

  /**
   * Generates new access and refresh tokens.
   * Prevents token reuse through session hash rotation.
   *
   * @param dto - Valid refresh token
   * @returns Rotated token pair
   */
  @ApiPublic({
    type: RefreshResDto,
    summary: 'Refresh token',
  })
  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<RefreshResDto> {
    return await this.authService.refreshToken(dto);
  }

  /**
   * Initiates the password recovery flow.
   * @todo Implement forgot-password email dispatch
   */
  @ApiPublic()
  @Post('forgot-password')
  async forgotPassword() {
    return 'forgot-password';
  }

  /**
   * Verifies the password reset token from email.
   * @todo Implement reset token verification
   */
  @ApiPublic()
  @Post('verify/forgot-password')
  async verifyForgotPassword() {
    return 'verify-forgot-password';
  }

  /**
   * Updates the password using a verified reset token.
   * @todo Implement password reset logic
   */
  @ApiPublic()
  @Post('reset-password')
  async resetPassword() {
    return 'reset-password';
  }

  /**
   * Verifies the user's email address via token link.
   * @todo Implement email verification logic
   */
  @ApiPublic()
  @Post('verify/email')
  async verifyEmail() {
    return 'verify-email';
  }

  /**
   * Resends the verification email to the user.
   * @todo Implement resend logic
   */
  @ApiPublic()
  @Post('verify/email/resend')
  async resendVerifyEmail() {
    return 'resend-verify-email';
  }
}
