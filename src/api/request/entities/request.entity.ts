import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { UserEntity } from '@/api/user/entities/user.entity';
import { DriverEntity } from '@/api/driver/entities/driver.entity';
import { RequestStatusEnum } from '../enums/request-status.enum';
import { dbEnumType } from '@/common/utils/db-types';

/**
 * Persistent representation of a customer service request.
 * Requests start as ephemeral cache entries and are persisted here upon transition 
 * to terminal states (Completed, Cancelled, Expired) or during active service (Accepted).
 *
 * @class RequestEntity
 * @extends AbstractEntity
 */
@Entity('requests')
export class RequestEntity extends AbstractEntity {
  /**
   * Unique UUID for the request.
   */
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_request_id' })
  id!: Uuid;

  /**
   * Volume of water/service requested.
   */
  @Column({ type: 'float', nullable: true })
  volume: number;

  /**
   * Minimum vehicle capability required to fulfill this request.
   */
  @Column({ nullable: true })
  requiredVehicleType: string;

  /**
   * Current lifecycle stage of the request.
   * @default RequestStatusEnum.SEARCHING
   */
  @Column({
    type: dbEnumType,
    enum: RequestStatusEnum,
    default: RequestStatusEnum.SEARCHING,
  })
  status: RequestStatusEnum;

  /**
   * FK to the User (Client) who initiated the request.
   */
  @Column({ type: 'uuid' })
  userId: Uuid;

  /**
   * Client profile details.
   */
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /**
   * Latitude coordinate for pickup.
   */
  @Column({ type: 'float', nullable: true })
  pickupLat: number;

  /**
   * Longitude coordinate for pickup.
   */
  @Column({ type: 'float', nullable: true })
  pickupLng: number;

  /**
   * FK to the target Product being requested.
   */
  @Column({ type: 'uuid', nullable: true })
  productId: Uuid;

  /**
   * FK to the Driver assigned to fulfill this request.
   */
  @Column({ type: 'uuid', nullable: true })
  driverId: Uuid;

  /**
   * Driver profile details.
   */
  @ManyToOne(() => DriverEntity)
  @JoinColumn({ name: 'driverId' })
  driver: DriverEntity;
}
