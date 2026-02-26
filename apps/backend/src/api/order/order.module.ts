import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { RequestAcceptedConsumer } from './consumers/request-accepted.consumer';
import { RideStartedConsumer } from './consumers/ride-started.consumer';
import { RideCompletedConsumer } from './consumers/ride-completed.consumer';
import { RequestCancelledConsumer } from './consumers/request-cancelled.consumer';
import { RabbitMqLibModule } from '@/libs/rabbitMq/rabbitMq.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity]), RabbitMqLibModule],
  providers: [
    OrderService,
    RequestAcceptedConsumer,
    RideStartedConsumer,
    RideCompletedConsumer,
    RequestCancelledConsumer,
  ],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
