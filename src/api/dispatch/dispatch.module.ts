import { Module } from '@nestjs/common';
import { RabbitMqLibModule } from '@/libs/rabbitMq/rabbitMq.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestModule } from '../request/request.module';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { DriverModule } from '../driver/driver.module';
import { OrderModule } from '../order/order.module';
import { MatchingService } from './matching.service';
import { DriverEntity } from '../driver/entities/driver.entity';

import { RequestCreatedConsumer } from './consumers/request-created.consumer';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity]),
    RabbitMqLibModule,
    AuthModule,
    RequestModule,
    DriverModule,
    OrderModule
  ],
  controllers: [DispatchController],
  providers: [DispatchService, MatchingService, RequestCreatedConsumer],
  exports: [DispatchService],
})
export class DispatchModule {}
