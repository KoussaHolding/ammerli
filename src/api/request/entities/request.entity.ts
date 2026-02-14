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

@Entity('requests')
export class RequestEntity extends AbstractEntity {
    @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_request_id' })
    id!: Uuid;

    @Column({ type: 'float', nullable: true })
    volume: number;

    @Column({ nullable: true })
    requiredVehicleType: string;

    @Column({
        type: 'enum',
        enum: RequestStatusEnum,
        default: RequestStatusEnum.SEARCHING,
    })
    status: RequestStatusEnum;

    @Column({ type: 'uuid' })
    userId: Uuid;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'uuid', nullable: true })
    driverId: Uuid;

    @ManyToOne(() => DriverEntity)
    @JoinColumn({ name: 'driverId' })
    driver: DriverEntity;
}
