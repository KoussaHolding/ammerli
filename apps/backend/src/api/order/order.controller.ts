import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@/decorators/http.decorators';

import { OrderService } from './order.service';
import { ListOrderReqDto } from './dto/list-order.req.dto';
import { OrderResDto } from './dto/order.res.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';

@ApiTags('Orders')
@Controller({
  path: 'orders',
  version: '1',
})
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiAuth({
    type: OrderResDto,
    summary: 'List orders',
    isPaginated: true,
  })
  async findAll(@Query() reqDto: ListOrderReqDto): Promise<OffsetPaginatedDto<OrderResDto>> {
    return this.orderService.findAll(reqDto);
  }
}
