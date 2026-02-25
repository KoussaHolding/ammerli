import { PricingContext } from './pricing-context.interface';

/**
 * Interface that all pricing strategies must implement.
 * Strategies are responsible for calculating a specific portion or override of the price.
 *
 * @interface IPricingStrategy
 */
export interface IPricingStrategy {
  /**
   * Unique identifier for the strategy.
   * Internal use for logging and debugging.
   */
  readonly name: string;

  /**
   * Priority of the strategy.
   * Lower numbers indicate higher precedence during aggregation.
   */
  readonly priority: number;

  /**
   * Calculates the price or price adjustment based on the provided context.
   *
   * @param context - The pricing context data.
   * @returns A promise that resolves to the calculated number or null if not applicable.
   */
  calculate(context: PricingContext): Promise<number | null>;
}
