import { RedisLibModule } from '@/libs/redis/redis.module';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { DriverMetadataCacheRepository } from './driver-metadata-cache.repository';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';

import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [
    RedisLibModule,
    forwardRef(() => DriverModule),
    ConfigModule,
    JwtModule.register({}),
  ],
  providers: [
    DriverMetadataCacheRepository,
    TrackingService,
    TrackingGateway,
  ],
  exports: [TrackingGateway, TrackingService],
})
export class TrackingModule {}
