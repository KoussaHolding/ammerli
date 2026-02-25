import { Uuid } from '@/common/types/common.type';

/**
 * Contextual data required by pricing strategies to calculate products prices.
 *
 * @interface PricingContext
 */
export interface PricingContext {
  /**
   * ID of the product being priced.
   */
  productId: Uuid;

  /**
   * Optional ID of the Wilaya for location-based pricing.
   */
  wilayaId?: Uuid;

  /**
   * Optional distance in kilometers for distance-based pricing.
   */
  distanceKm?: number;

  /**
   * Optional quantity for volume-based pricing or discounts.
   */
  quantity?: number;
}
