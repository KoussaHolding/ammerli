import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Statistics API query parameters.
 */
export class StatisticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Time granularity for trends',
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly', 'monthly'])
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';
}
