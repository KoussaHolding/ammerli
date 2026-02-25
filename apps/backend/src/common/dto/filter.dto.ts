import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from './offset-pagination/page-options.dto'; // or whatever the path should be

export class FilterDto extends PageOptionsDto {
  /**
   * Generic search term applied across specified text columns
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter records created on or after this date
   */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtGte?: Date;

  /**
   * Filter records created on or before this date
   */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtLte?: Date;
}
