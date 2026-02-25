import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity representing a Wilaya (province) in Algeria.
 * This is a standalone entity used by various modules (Pricing, Delivery, etc.)
 * to identify geographical locations.
 *
 * @class WilayaEntity
 * @extends AbstractEntity
 */
@Entity('wilayas')
export class WilayaEntity extends AbstractEntity {
  /**
   * Unique identifier for the Wilaya.
   */
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_wilaya_id' })
  id!: Uuid;

  /**
   * Official code of the Wilaya (e.g., "16" for Algiers, "31" for Oran).
   */
  @Column({ unique: true })
  @Index('UQ_wilaya_code', { unique: true })
  code!: string;

  /**
   * Name of the Wilaya.
   */
  @Column()
  name!: string;

  /**
   * Whether this Wilaya is active for service.
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
