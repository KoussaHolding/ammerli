import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { DriverEntity } from './entities/driver.entity';

import { DriverMetadataService } from './driver-metadata.service';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity])],
  controllers: [DriverController],
  providers: [DriverService, DriverMetadataService],
  exports: [DriverService, DriverMetadataService],
})
export class DriverModule {}
