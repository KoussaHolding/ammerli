import { Body, Controller, Post, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { UserEntity } from '@/api/user/entities/user.entity'; // Or DriverEntity context?
import { ApiBearerAuth } from '@nestjs/swagger';
import { Uuid } from '@/common/types/common.type';

import { IsNotEmpty, IsUUID } from 'class-validator';

class AcceptRequestDto {
  @IsNotEmpty()
  @IsUUID()
  requestId: Uuid;
}

@ApiTags('Dispatch')
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver accepts a request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request accepted' })
  async acceptRequest(@Body() dto: AcceptRequestDto, @CurrentUser() user: any) {
     // user should be a driver. Assuming user.id is driverId or we have a way to identify.
     // For now, let's assume the Auth guard populates user correctly.
     // In a real app, we might need to verify if user is a driver.
     return await this.dispatchService.acceptRequest(dto.requestId, user.id);
  }
}
