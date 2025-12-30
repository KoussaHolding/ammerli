import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DriverEntity } from './entities/driver.entity';

@Injectable()
export class DriverRepository extends Repository<DriverEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(DriverEntity, dataSource.createEntityManager());
  }
}
