import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { DriverEntity } from './entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity]), AuthModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [],
})
export class DriverModule {}
