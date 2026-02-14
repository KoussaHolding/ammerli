import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('device_tokens')
export class DeviceTokenEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_device_token_id' })
  id!: Uuid;

  @Column()
  userId: string; // Links to User/Driver ID

  @Column({ nullable: true })
  userType: 'USER' | 'DRIVER';

  @Column()
  token: string; // FCM Token

  @Column({ default: 'mobile' })
  platform: string; // ios/android/web
}
