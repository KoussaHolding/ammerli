import { Injectable, Logger } from '@nestjs/common';
import { BasePricingStrategy } from './strategies/base-pricing.strategy';
import { WilayaPricingStrategy } from './strategies/wilaya-pricing.strategy';
import { PricingContext } from './interfaces/pricing-context.interface';
import { IPricingStrategy } from './interfaces/pricing-strategy.interface';

/**
 * Service responsible for calculating prices using an aggregate of strategies.
 * Implements the Strategy Pattern to allow flexible and extensible pricing logic.
 *
 * @class PricingService
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly strategies: IPricingStrategy[];

  constructor(
    private readonly baseStrategy: BasePricingStrategy,
    private readonly wilayaStrategy: WilayaPricingStrategy,
  ) {
    // Register strategies and sort by priority (lower number = higher priority)
    this.strategies = [this.wilayaStrategy, this.baseStrategy].sort(
      (a, b) => a.priority - b.priority,
    );
  }

  /**
   * Calculates the final price for a product based on the provided context.
   * It iterates through registered strategies and returns the first non-null result.
   *
   * @param context - Data required for price calculation (productId, wilayaId, etc.)
   * @returns The calculated price.
   * @throws {Error} If no price could be calculated by any strategy.
   */
  async calculatePrice(context: PricingContext): Promise<number> {
    this.logger.debug(`Calculating price for context: ${JSON.stringify(context)}`);

    for (const strategy of this.strategies) {
      const price = await strategy.calculate(context);
      if (price !== null) {
        this.logger.debug(`Strategy '${strategy.name}' returned price: ${price}`);
        return price;
      }
    }

    this.logger.error(`No pricing strategy could calculate a price for context: ${JSON.stringify(context)}`);
    throw new Error('Could not calculate price for the given context');
  }
}
