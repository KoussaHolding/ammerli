import { Body, Controller, Post, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { UserEntity } from '@/api/user/entities/user.entity'; // Or DriverEntity context?
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@/decorators/roles.decorator';
import { UserRoleEnum } from '@/api/user/enums/user-role.enum';
import { Uuid } from '@/common/types/common.type';

import { IsNotEmpty, IsUUID } from 'class-validator';

class AcceptRequestDto {
  @IsNotEmpty()
  @IsUUID()
  requestId: Uuid;
}

import { AuthGuard } from '@/guards/auth.guard';
import { RolesGuard } from '@/guards/roles.guard';

/**
 * Controller for managing driver-side dispatch actions.
 * Currently supports explicitly accepting a dispatched service request.
 *
 * @version 1
 * @tag Dispatch
 */
@ApiTags('Dispatch')
@Controller({
  path: 'dispatch',
  version: '1',
})
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  /**
   * Allows a driver to accept a request that has been offered to them.
   * Restricted to users with the DRIVER role.
   *
   * @param dto - Contains the unique ID of the request to accept
   * @param user - Currently authenticated driver
   * @returns Success confirmation and initialized job details
   * @throws {AppException} If request is no longer available or driver not found
   */
  @Post('accept')
  @Roles(UserRoleEnum.DRIVER)
  @ApiAuth({
    summary: 'Driver accepts a request',
    statusCode: HttpStatus.OK,
  })
  async acceptRequest(@Body() dto: AcceptRequestDto, @CurrentUser() user: any) {
    return await this.dispatchService.acceptRequest(dto.requestId, user.id);
  }
}
