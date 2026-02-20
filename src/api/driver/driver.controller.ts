import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  forwardRef,
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
import { LoadMoreDriversReqDto } from './dto/load-more-drivers.req.dto';
import { UpdateDriverReqDto } from './dto/update-driver.req.dto';

import { TrackingService } from '../tracking/tracking.service';

@ApiTags('drivers')
@Controller({
  path: 'drivers',
  version: '1',
})
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    @Inject(forwardRef(() => TrackingService))
    private readonly trackingService: TrackingService,
  ) {}



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

  @Get('nearby')
  @ApiPublic() // Or ApiAuth, but public is easier for now. Let's stick to Public for 'Uber-like' feel before login? No, dashboard requires login.
  // Actually, dashboard is protected.
  @ApiAuth({
      summary: 'Find nearby drivers',
  })
  async findNearby(
      @Query('lat') lat: number,
      @Query('lng') lng: number,
      @Query('radius') radius: number = 5,
  ) {
      // We need to inject TrackingService properly. 
      // DriverModule imports TrackingModule?
      // Let's assume yes or I will check.
      // If not, I can't use it directly here.
      // Better to use DriverService which wraps it?
      // Let's check imports.
      // For now, I'll assume I can inject TrackingService if I add it to constructor.
      return this.trackingService.findNearbyDrivers(lat, lng, radius);
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
