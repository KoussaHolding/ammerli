import { Uuid } from '@/common/types/common.type';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';
import { PricingService } from '../pricing/pricing.service';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ListProductReqDto } from './dto/list-product.req.dto';
import { plainToInstance } from 'class-transformer';
import { paginate } from '@/utils/offset-pagination';
import { applyFiltersToQueryBuilder } from '@/utils/query-filter.util';


@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly pricingService: PricingService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(reqDto: ListProductReqDto): Promise<OffsetPaginatedDto<ProductEntity>> {
    const query = this.productRepository.createQueryBuilder('product');

    // Default behavior preserves existing assumptions unless explicitly overridden
    if (reqDto.isActive === undefined) {
      query.andWhere('product.isActive = :isActive', { isActive: true });
    } else {
      query.andWhere('product.isActive = :isActive', { isActive: reqDto.isActive });
    }

    applyFiltersToQueryBuilder(query, reqDto, {
      searchColumns: ['product.name', 'product.description'],
    });

    query.orderBy('product.capacityLiters', 'ASC');

    const [products, metaDto] = await paginate<ProductEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(
      plainToInstance(ProductEntity, products),
      metaDto,
    );
  }


  async findOne(id: string, wilayaId?: string): Promise<ProductEntity & { calculatedPrice?: number }> {
    const product = await this.productRepository.findOneBy({ id: id as Uuid });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (wilayaId) {
      const calculatedPrice = await this.pricingService.calculatePrice({
        productId: product.id,
        wilayaId: wilayaId as Uuid,
      });
      return Object.assign(product, { calculatedPrice });
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    const product = await this.findOne(id);
    this.productRepository.merge(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
  }
}
