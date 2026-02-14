import { Body, Controller, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResDto } from './dto/request.res.dto';
import { RequestService } from './request.service';
import { RequestStatusEnum } from './enums/request-status.enum';

@ApiTags('Requests')
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @ApiAuth({
    type: UserResDto,
    summary: 'create a new request',
    statusCode: HttpStatus.CREATED,
  })
  async create(
    @Body() createRequestDto: CreateRequestDto,
    @CurrentUser() user: UserResDto,
  ): Promise<RequestResDto> {
    return this.requestService.createRequest(createRequestDto, user);
  }

  @Post(':id/complete')
  @ApiAuth({
    summary: 'Complete a request',
    statusCode: HttpStatus.OK,
  })
  async complete(@Param('id') id: string) {
      return await this.requestService.finalizeRequest(id, RequestStatusEnum.COMPLETED);
  }

  @Post(':id/cancel')
  @ApiAuth({
    summary: 'Cancel a request',
    statusCode: HttpStatus.OK,
  })
  async cancel(@Param('id') id: string) {
      return await this.requestService.finalizeRequest(id, RequestStatusEnum.CANCELLED);
  }
}
