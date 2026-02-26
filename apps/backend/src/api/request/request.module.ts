import { RabbitMqLibModule } from '@/libs/rabbitMq/rabbitMq.module';
import { RedisLibModule } from '@/libs/redis/redis.module';
import { Module } from '@nestjs/common';

import { RequestCacheRepository } from './request-cache.repository';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from '../order/order.module';
import { TrackingModule } from '../tracking/tracking.module';
import { RequestEntity } from './entities/request.entity';

@Module({
  imports: [
    RedisLibModule,
    RabbitMqLibModule,
    TypeOrmModule.forFeature([RequestEntity]),
    OrderModule,
    TrackingModule,
  ],
  controllers: [RequestController],
  providers: [
    RequestService,
    RequestCacheRepository,
  ],
  exports: [RequestService],
})
export class RequestModule {}
