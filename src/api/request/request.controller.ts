import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiPublic } from '@/decorators/http.decorators';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestService } from './request.service';

@ApiTags('Requests')
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiPublic()
  async create(
    @Body() createRequestDto: CreateRequestDto,
    @CurrentUser() user: UserResDto,
  ) {
    return this.requestService.createRequest(createRequestDto, {
      id: '0293840jwondfowneoifwef',
      firstName: 'chams',
      lastName: 'dev',
      phone: '0987654321',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
