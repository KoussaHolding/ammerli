import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserRoleEnum } from '@/api/user/enums/user-role.enum';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { Roles } from '@/decorators/roles.decorator';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResDto } from './dto/request.res.dto';
import { ListRequestReqDto } from './dto/list-request.req.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { RequestStatusEnum } from './enums/request-status.enum';
import { RequestService } from './request.service';

/**
 * Controller for managing customer requests and driver-side state updates.
 * Orchestrates the lifecycle from initial creation to finalization.
 *
 * @version 1
 * @tag Requests
 */
@ApiTags('Requests')
@Controller({
  path: 'requests',
  version: '1',
})
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  /**
   * Submits a new service request.
   * Restricted to users with the CLIENT role.
   *
   * @param createRequestDto - Request details (coordinates, quantity, product)
   * @param user - Currently authenticated client
   * @returns The initialized request object
   */
  @Post()
  @Roles(UserRoleEnum.CLIENT)
  @ApiAuth({
    type: UserResDto, // Note: This type seems incorrect in original code (should be RequestResDto), checking context
    summary: 'create a new request',
    statusCode: HttpStatus.CREATED,
  })
  async create(
    @Body() createRequestDto: CreateRequestDto,
    @CurrentUser() user: UserResDto,
  ): Promise<RequestResDto> {
    return this.requestService.createRequest(user.id as Uuid, createRequestDto, user);
  }

  /**
   * Retrieves a list of historical requests with pagination and filtering.
   *
   * @param reqDto - Pagination and filtering arguments
   * @returns Paginated result of requests
   */
  @Get()
  @ApiAuth({
    type: RequestResDto,
    summary: 'List requests',
    isPaginated: true,
  })
  async findAll(
    @Query() reqDto: ListRequestReqDto,
  ): Promise<OffsetPaginatedDto<RequestResDto>> {
    return this.requestService.findAll(reqDto);
  }


  /**
   * Retrieves the current user's active request if it existence.
   * Checks both cache and persistent storage for live requests.
   *
   * @param user - Currently authenticated user
   * @returns The active request or null
   */
  @Get('active')
  @ApiAuth({
    type: RequestResDto,
    summary: 'Get active request for current user',
    statusCode: HttpStatus.OK,
  })
  async getActive(
    @CurrentUser() user: UserResDto,
  ): Promise<RequestResDto | null> {
    return this.requestService.findActiveRequest(user.id as Uuid);
  }

  /**
   * DRIVER ONLY: Signals that the driver has arrived at the pickup location.
   * Transitions request state to ARRIVED.
   *
   * @param id - Request identifier
   * @returns Updated request object
   */
  @Post(':id/arrived')
  @Roles(UserRoleEnum.DRIVER)
  @ApiAuth({
    summary: 'Driver arrived at pickup location',
    statusCode: HttpStatus.OK,
  })
  async arrived(@Param('id') id: string) {
    return await this.requestService.finalizeRequest(
      id,
      RequestStatusEnum.ARRIVED,
    );
  }

  /**
   * DRIVER ONLY: Signals that the ride/delivery has physically started.
   * Transitions request state to IN_PROGRESS.
   *
   * @param id - Request identifier
   * @returns Updated request object
   */
  @Post(':id/start')
  @Roles(UserRoleEnum.DRIVER)
  @ApiAuth({
    summary: 'Start the ride/delivery',
    statusCode: HttpStatus.OK,
  })
  async start(@Param('id') id: string) {
    return await this.requestService.finalizeRequest(
      id,
      RequestStatusEnum.IN_PROGRESS,
    );
  }

  /**
   * DRIVER ONLY: Signals successful completion of the request.
   * Transition request state to COMPLETED and triggers persistence.
   *
   * @param id - Request identifier
   * @returns Finalized request object
   */
  @Post(':id/complete')
  @Roles(UserRoleEnum.DRIVER)
  @ApiAuth({
    summary: 'Complete a request',
    statusCode: HttpStatus.OK,
  })
  async complete(@Param('id') id: string) {
    return await this.requestService.finalizeRequest(
      id,
      RequestStatusEnum.COMPLETED,
    );
  }

  /**
   * CLIENT ONLY: Aborts the request.
   * Transitions request state to CANCELLED and triggers persistence for audit record.
   *
   * @param id - Request identifier
   * @returns Finalized (cancelled) request object
   */
  @Post(':id/cancel')
  @Roles(UserRoleEnum.CLIENT)
  @ApiAuth({
    summary: 'Cancel a request',
    statusCode: HttpStatus.OK,
  })
  async cancel(@Param('id') id: string) {
    return await this.requestService.finalizeRequest(
      id,
      RequestStatusEnum.CANCELLED,
    );
  }
}
