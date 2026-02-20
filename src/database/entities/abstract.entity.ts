import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { plainToInstance } from 'class-transformer';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DataSource,
  UpdateDateColumn,
} from 'typeorm';
import { getOrder, Order } from '../decorators/order.decorator';
import { dateTimeType } from '@/common/utils/db-types';

/**
 * Base class for all domain entities.
 * Provdes standard audit fields (timestamps, creators) and utility methods for 
 * DTO conversion and column ordering.
 *
 * @class AbstractEntity
 * @extends BaseEntity
 */
export abstract class AbstractEntity extends BaseEntity {
  /**
   * Automatic timestamp for record creation.
   */
  @Order(9999)
  @CreateDateColumn({
    name: 'created_at',
    type: dateTimeType,
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  /**
   * Application user ID (or system ID) that created the record.
   * @default SYSTEM_USER_ID
   */
  @Order(9999)
  @Column({
    name: 'created_by',
    type: 'varchar',
    nullable: false,
    default: SYSTEM_USER_ID,
  })
  createdBy: string;

  /**
   * Automatic timestamp for the last record update.
   */
  @Order(9999)
  @UpdateDateColumn({
    name: 'updated_at',
    type: dateTimeType,
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;

  /**
   * Application user ID that performed the latest update.
   * @default SYSTEM_USER_ID
   */
  @Order(9999)
  @Column({
    name: 'updated_by',
    type: 'varchar',
    nullable: false,
    default: SYSTEM_USER_ID,
  })
  updatedBy: string;

  /**
   * Maps the current entity instance to a specific DTO class using class-transformer.
   *
   * @param dtoClass - The target DTO class constructor
   * @returns An instance of the DTO class populated with entity data
   */
  toDto<Dto>(dtoClass: new () => Dto): Dto {
    return plainToInstance(dtoClass, this);
  }

  /**
   * Extends TypeORM's data source binding to support custom column ordering.
   * Uses the @Order decorator to sort columns in the metadata map.
   *
   * @param dataSource - The active database connection source
   */
  static useDataSource(dataSource: DataSource) {
    BaseEntity.useDataSource.call(this, dataSource);
    const meta = dataSource.entityMetadatasMap.get(this);
    if (meta != null) {
      meta.columns = [...meta.columns].sort((x, y) => {
        const orderX = getOrder((x.target as any)?.prototype, x.propertyName);
        const orderY = getOrder((y.target as any)?.prototype, y.propertyName);
        return orderX - orderY;
      });
    }
  }
}
