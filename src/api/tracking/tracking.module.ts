import { RedisLibModule } from '@/libs/redis/redis.module';
import { Module } from '@nestjs/common';

import { DriverMetadataCacheRepository } from './driver-metadata-cache.repository';
import { TrackingGateway } from './tracking.getway';
import { TrackingService } from './tracking.service';

import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [RedisLibModule, DriverModule],
  providers: [
    DriverMetadataCacheRepository,
    TrackingService,
    TrackingGateway,
  ],
  exports: [TrackingGateway],
})
export class TrackingModule {}
