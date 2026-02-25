import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingContext } from '../interfaces/pricing-context.interface';
import { IPricingStrategy } from '../interfaces/pricing-strategy.interface';
import { ProductEntity } from '@/api/product/entities/product.entity';

/**
 * Default pricing strategy that returns the product's base price.
 * This serves as the fallback or starting point for pricing.
 *
 * @class BasePricingStrategy
 * @implements {IPricingStrategy}
 */
@Injectable()
export class BasePricingStrategy implements IPricingStrategy {
  readonly name = 'BasePricing';
  readonly priority = 100; // Low priority, serves as fallback

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Fetches the base price for a product.
   *
   * @param context - The pricing context containing at least the productId.
   * @returns The product's base price.
   * @throws {NotFoundException} If product is not found.
   */
  async calculate(context: PricingContext): Promise<number | null> {
    const product = await this.productRepository.findOneBy({ id: context.productId as any });
    if (!product) {
      throw new NotFoundException(`Product with ID ${context.productId} not found`);
    }
    return product.basePrice;
  }
}
