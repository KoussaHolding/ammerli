import { ProductEntity } from '@/api/product/entities/product.entity';
import { WilayaEntity } from '@/api/wilaya/entities/wilaya.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity representing a specific pricing rule for a product in a wilaya.
 * This overrides the base price of the product for the specified location.
 *
 * @class PricingRuleEntity
 * @extends AbstractEntity
 */
@Entity('pricing_rules')
@Index('UQ_product_wilaya_pricing', ['productId', 'wilayaId'], { unique: true })
export class PricingRuleEntity extends AbstractEntity {
  /**
   * Unique identifier for the pricing rule.
   */
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_pricing_rule_id' })
  id!: Uuid;

  /**
   * ID of the product this rule applies to.
   */
  @Column({ type: 'uuid' })
  productId!: Uuid;

  /**
   * Reference to the product entity.
   */
  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'productId' })
  product!: ProductEntity;

  /**
   * ID of the Wilaya this rule applies to.
   */
  @Column({ type: 'uuid' })
  wilayaId!: Uuid;

  /**
   * Reference to the wilaya entity.
   */
  @ManyToOne(() => WilayaEntity)
  @JoinColumn({ name: 'wilayaId' })
  wilaya!: WilayaEntity;

  /**
   * The price override for the product in this wilaya.
   */
  @Column({ name: 'price_override', type: 'decimal', precision: 10, scale: 2 })
  priceOverride!: number;

  /**
   * Whether this pricing rule is active.
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
