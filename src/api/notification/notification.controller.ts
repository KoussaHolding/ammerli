import { UserEntity } from '@/api/user/entities/user.entity';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { NotificationService } from './notification.service';

class RegisterTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform: string;
}

// Assume we have JwtAuthGuard globally or need to import it.
// For now, let's assume it's applied or add if needed.
// Checking imports usually requires context, but assuming standard boilerplate pattern.

@ApiTags('Notification')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('device-token')
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard) // Ensuring we have user context
  async registerToken(
    @CurrentUser() user: UserEntity,
    @Body() dto: RegisterTokenDto,
  ) {
    // Determine user type based on IAuthUser properties or context
    // For now assuming user.role or similar exists, or pass it explicitly?
    // In this boilerplate, usually users and drivers are separate or have roles.
    // Let's default to 'USER' or update based on role if available.

    // Quick fix: UserType should ideally be determined by the logical context or role
    const userType = (user as any).role === 'DRIVER' ? 'DRIVER' : 'USER';

    return await this.notificationService.saveToken(
      user.id,
      dto.token,
      dto.platform,
      userType,
    );
  }
}
