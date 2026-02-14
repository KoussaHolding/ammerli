import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '@/api/user/entities/user.entity';
import { DriverEntity } from '@/api/driver/entities/driver.entity';
import { RequestEntity } from '@/api/request/entities/request.entity';

@Entity('ratings')
export class RatingEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_rating_id' })
  id!: Uuid;

  @Column({ type: 'int' })
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column()
  reviewerId: Uuid;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: UserEntity;

  @Column()
  targetId: Uuid;

  @ManyToOne(() => DriverEntity)
  @JoinColumn({ name: 'targetId' })
  target: DriverEntity;

  @Column()
  requestId: Uuid;

  @OneToOne(() => RequestEntity)
  @JoinColumn({ name: 'requestId' })
  request: RequestEntity;
}
