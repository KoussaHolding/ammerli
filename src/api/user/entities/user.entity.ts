import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { hashPassword as hashPass } from '@/utils/password.util';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { dateTimeType, dbEnumType } from '@/common/utils/db-types';
import { UserRoleEnum } from '../enums/user-role.enum';

/**
 * Persistent entity representing a User in the system.
 * Extends AbstractEntity for common audit fields (createdAt, updatedAt, etc.).
 *
 * @class UserEntity
 * @extends AbstractEntity
 */
@Entity('users')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  /**
   * Unique UUID for the user.
   */
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_user_id' })
  id!: Uuid;

  /**
   * User's first name.
   */
  @Column({
    name: 'first_name',
    default: '',
  })
  firstName!: string;

  /**
   * User's last name.
   */
  @Column({
    name: 'last_name',
    default: '',
  })
  lastName!: string;

  /**
   * Unique phone number used for login and notifications.
   * Indexed for fast lookups; unique across non-deleted accounts.
   */
  @Column()
  @Index('UQ_user_phone', { where: '"deleted_at" IS NULL', unique: true })
  phone: string;

  /**
   * Optional unique email address.
   */
  @Column({ nullable: true })
  @Index('UQ_user_email', { where: '"deleted_at" IS NULL', unique: true })
  email?: string;

  /**
   * User's functional role in the system (Client, Driver, Admin).
   */
  @Column({
    type: dbEnumType,
    enum: UserRoleEnum,
    default: UserRoleEnum.CLIENT,
  })
  role: UserRoleEnum;

  /**
   * Hashed password.
   * Excluded from all API responses for security.
   */
  @Column()
  @Exclude()
  password!: string;

  /**
   * Short text biography.
   */
  @Column({ default: '' })
  bio?: string;

  /**
   * URL to the profile image.
   */
  @Column({ default: '' })
  image?: string;

  /**
   * Soft deletion timestamp.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: dateTimeType,
    default: null,
  })
  deletedAt: Date;

  /**
   * Active and historical login sessions for this user.
   */
  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions?: SessionEntity[];

  /**
   * TypeORM Hook: Hashes the plain-text password before persisting to database.
   * Triggered on initial creation and updates to the password field.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await hashPass(this.password);
    }
  }
}
