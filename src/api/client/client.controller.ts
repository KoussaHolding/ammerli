import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { ClientResDto } from './dto/client.res.dto';
import { ListClientReqDto } from './dto/list-client.req.dto';
import { LoadMoreClientsReqDto } from './dto/load-more-clients.req.dto';
import { UpdateClientReqDto } from './dto/update-client.req.dto';

@ApiTags('Clients')
@Controller({
  path: 'Clients',
  version: '1',
})
export class ClientController {
  constructor(private readonly ClientService: ClientService) {}



  @Get()
  @ApiPublic()
  @ApiAuth({
    type: ClientResDto,
    summary: 'List Clients',
    isPaginated: true,
  })
  async findAllClients(
    @Query() reqDto: ListClientReqDto,
  ): Promise<OffsetPaginatedDto<ClientResDto>> {
    return await this.ClientService.findAll(reqDto);
  }

  @Get('/load-more')
  @ApiAuth({
    type: ClientResDto,
    summary: 'Load more Clients',
    isPaginated: true,
    paginationType: 'cursor',
  })
  async loadMoreClients(
    @Query() reqDto: LoadMoreClientsReqDto,
  ): Promise<CursorPaginatedDto<ClientResDto>> {
    return await this.ClientService.loadMoreClients(reqDto);
  }

  @Get(':id')
  @ApiPublic()
  @ApiAuth({ type: ClientResDto, summary: 'Find Client by id' })
  @ApiParam({ name: 'id', type: 'String' })
  async findClient(
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<ClientResDto> {
    return await this.ClientService.findOne(id);
  }

  @Patch(':id')
  @ApiAuth({ type: ClientResDto, summary: 'Update Client' })
  @ApiParam({ name: 'id', type: 'String' })
  updateClient(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateClientReqDto,
  ) {
    return this.ClientService.update(id, reqDto);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Delete Client',
    errorResponses: [400, 401, 403, 404, 500],
  })
  @ApiParam({ name: 'id', type: 'String' })
  removeClient(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.ClientService.remove(id);
  }
}
