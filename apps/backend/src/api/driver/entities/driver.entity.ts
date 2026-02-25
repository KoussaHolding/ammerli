import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { dbEnumType } from '@/common/utils/db-types';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { DriverTypeEnum } from '../enums/driver-type.enum';

@Entity('drivers')
export class DriverEntity extends AbstractEntity {
  constructor(data?: Partial<DriverEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_driver_id' })
  id!: Uuid;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column({
    type: dbEnumType,
    enum: DriverTypeEnum,
    default: DriverTypeEnum.MOTORCYCLE,
  })
  type: DriverTypeEnum;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalJobs: number;
}
