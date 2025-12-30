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
import { DriverService } from './driver.service';
import { DriverResDto } from './dto/driver.res.dto';
import { ListDriverReqDto } from './dto/list-driver.req.dto';
import { LoadMoreDriversReqDto } from './dto/load-more-users.req.dto';
import { RegisterDriverReqDto } from './dto/register-driver.req.dto';
import { UpdateDriverReqDto } from './dto/update-driver.req.dto';

@ApiTags('drivers')
@Controller({
  path: 'drivers',
  version: '1',
})
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @ApiPublic()
  @ApiAuth({
    type: DriverResDto,
    summary: 'Create driver',
    statusCode: HttpStatus.CREATED,
  })
  async createDriver(
    @Body() registerDriverDto: RegisterDriverReqDto,
  ): Promise<DriverResDto> {
    return await this.driverService.register(registerDriverDto);
  }

  @Get()
  @ApiPublic()
  @ApiAuth({
    type: DriverResDto,
    summary: 'List Drivers',
    isPaginated: true,
  })
  async findAllDrivers(
    @Query() reqDto: ListDriverReqDto,
  ): Promise<OffsetPaginatedDto<DriverResDto>> {
    return await this.driverService.findAll(reqDto);
  }

  @Get('/load-more')
  @ApiAuth({
    type: DriverResDto,
    summary: 'Load more Drivers',
    isPaginated: true,
    paginationType: 'cursor',
  })
  async loadMoreDrivers(
    @Query() reqDto: LoadMoreDriversReqDto,
  ): Promise<CursorPaginatedDto<DriverResDto>> {
    return await this.driverService.loadMoreDrivers(reqDto);
  }

  @Get(':id')
  @ApiPublic()
  @ApiAuth({ type: DriverResDto, summary: 'Find Driver by id' })
  @ApiParam({ name: 'id', type: 'String' })
  async findDriver(
    @Param('id', ParseUUIDPipe) id: Uuid,
  ): Promise<DriverResDto> {
    return await this.driverService.findOne(id);
  }

  @Patch(':id')
  @ApiAuth({ type: DriverResDto, summary: 'Update Driver' })
  @ApiParam({ name: 'id', type: 'String' })
  updateDriver(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateDriverReqDto,
  ) {
    return this.driverService.update(id, reqDto);
  }

  @Delete(':id')
  @ApiAuth({
    summary: 'Delete Driver',
    errorResponses: [400, 401, 403, 404, 500],
  })
  @ApiParam({ name: 'id', type: 'String' })
  removeDriver(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.driverService.remove(id);
  }
}
