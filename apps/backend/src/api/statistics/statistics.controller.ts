import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleEnum } from '../user/enums/user-role.enum';
import { AuthGuard } from '@/guards/auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto } from './dtos/statistics-query.dto';

import { ErrorMessageConstants } from '@/constants/error-code.constant';

/**
 * Controller for system-wide statistics.
 * Access is restricted to users with the ADMIN role.
 */
@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Controller('v1/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Manually invalidates the statistics cache to force re-computation of real-time metrics.
   * 
   * @returns A success message confirming cache invalidation.
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Invalidate statistics cache for real-time data' })
  async refreshCache() {
    await this.statisticsService.clearCache();
    return { message: 'Statistics cache invalidated successfully' };
  }

  /**
   * Retrieves a comprehensive dashboard summary including user, order, and revenue KPIs.
   * 
   * @param query - Filtering parameters for the dashboard data.
   * @returns A consolidated statistics object.
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get full dashboard metrics for admin panel' })
  async getDashboard(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getDashboardSummary(query);
  }

  /**
   * Retrieves a specific subset of metrics (e.g., just revenue or just users).
   * 
   * @param name - The metric domain name.
   * @param query - Filtering parameters.
   * @returns The requested domain-specific metrics.
   */
  @Get('report')
  @ApiOperation({ summary: 'Get specific metric report by domain name' })
  async getReport(
    @Query('name') name: string,
    @Query() query: StatisticsQueryDto,
  ) {
    return this.statisticsService.getMetricByName(name, query);
  }
}
