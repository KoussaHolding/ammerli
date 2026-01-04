import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';

@Entity('Clients')
export class ClientEntity extends AbstractEntity {
  constructor(data?: Partial<ClientEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_Client_id' })
  id!: Uuid;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;
}
