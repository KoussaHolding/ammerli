import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { UserEntity } from './user.entity';

/**
 * Persistent entity representing a User Session.
 * Used for JWT invalidation and session tracking.
 *
 * @class SessionEntity
 * @extends AbstractEntity
 */
@Entity('session')
export class SessionEntity extends AbstractEntity {
  constructor(data?: Partial<SessionEntity>) {
    super();
    Object.assign(this, data);
  }

  /**
   * Unique UUID for the session.
   */
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_session_id',
  })
  id!: Uuid;

  /**
   * Random hash used for refresh token rotation and validation.
   */
  @Column({
    name: 'hash',
    type: 'varchar',
    length: 255,
  })
  hash!: string;

  /**
   * Foreign key to the User who owns this session.
   */
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: Uuid;

  /**
   * The User entity associated with this session.
   */
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_session_user',
  })
  @ManyToOne('UserEntity', (user: UserEntity) => user.sessions)
  user!: UserEntity;
}
