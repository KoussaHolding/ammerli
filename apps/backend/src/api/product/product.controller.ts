import { ApiPublic } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiExtraModels, ApiOkResponse } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductReqDto } from './dto/list-product.req.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';

import { ProductEntity } from './entities/product.entity';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller({
  path: 'products',
  version: '1',
})
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductEntity> {
    return await this.productService.create(createProductDto);
  }

  @ApiPublic()
  @Get()
  @ApiExtraModels(OffsetPaginatedDto, ProductEntity)
  async findAll(@Query() reqDto: ListProductReqDto): Promise<OffsetPaginatedDto<ProductEntity>> {
    return await this.productService.findAll(reqDto);
  }


  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('wilayaId') wilayaId?: string,
  ): Promise<ProductEntity> {
    return await this.productService.findOne(id, wilayaId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    return await this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.productService.remove(id);
  }
}
