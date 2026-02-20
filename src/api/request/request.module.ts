import { RedisLibModule } from '@/libs/redis/redis.module';
import { RabbitMqLibModule } from '@/libs/rabbitMq/rabbitMq.module';
import { forwardRef, Module } from '@nestjs/common';

import { RequestCacheRepository } from './request-cache.repository';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from './entities/request.entity';
import { OrderModule } from '../order/order.module';
import { RequestDispatchedConsumer } from './consumers/request-dispatched.consumer';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    RedisLibModule,
    RabbitMqLibModule,
    TypeOrmModule.forFeature([RequestEntity]),
    OrderModule,
    TrackingModule,
  ],
  controllers: [RequestController],
  providers: [RequestService, RequestCacheRepository, RequestDispatchedConsumer],
  exports: [RequestService],
})
export class RequestModule {}
