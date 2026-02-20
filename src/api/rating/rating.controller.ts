import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingService } from './rating.service';

// Assume JwtAuthGuard is standard
// import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@ApiTags('Rating')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  async createRating(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateRatingDto,
  ) {
    return await this.ratingService.create(user.id, dto);
  }

  @Get('driver/:driverId')
  async getDriverRatings(@Param('driverId') driverId: Uuid) {
    return await this.ratingService.getDriverRatings(driverId);
  }
}
