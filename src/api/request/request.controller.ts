import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/decorators/current-user.decorator';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestService } from './request.service';

@ApiTags('Requests')
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new water delivery request' })
  async create(
    @Body() createRequestDto: CreateRequestDto,
    @CurrentUser() user: UserResDto,
  ) {
    return this.requestService.createRequest(createRequestDto, user);
  }
}
