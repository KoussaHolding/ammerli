import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRuleEntity } from '../entities/pricing-rule.entity';
import { PricingContext } from '../interfaces/pricing-context.interface';
import { IPricingStrategy } from '../interfaces/pricing-strategy.interface';

/**
 * Strategy for location-specific pricing based on Wilayas.
 * Returns the override price if a rule exists for the given Product and Wilaya.
 *
 * @class WilayaPricingStrategy
 * @implements {IPricingStrategy}
 */
@Injectable()
export class WilayaPricingStrategy implements IPricingStrategy {
  readonly name = 'WilayaPricing';
  readonly priority = 10; // High priority, overrides base price

  constructor(
    @InjectRepository(PricingRuleEntity)
    private readonly pricingRuleRepository: Repository<PricingRuleEntity>,
  ) {}

  /**
   * Checks for a pricing rule specific to the Wilaya in the context.
   *
   * @param context - The pricing context (requires productId and wilayaId).
   * @returns The override price if found, otherwise null.
   */
  async calculate(context: PricingContext): Promise<number | null> {
    if (!context.wilayaId) {
      return null;
    }

    const rule = await this.pricingRuleRepository.findOne({
      where: {
        productId: context.productId,
        wilayaId: context.wilayaId,
        isActive: true,
      },
    });

    return rule ? Number(rule.priceOverride) : null;
  }
}
