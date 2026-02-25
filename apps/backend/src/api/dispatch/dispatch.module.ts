import { RabbitMqLibModule } from '@/libs/rabbitMq/rabbitMq.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverModule } from '../driver/driver.module';
import { DriverEntity } from '../driver/entities/driver.entity';
import { OrderModule } from '../order/order.module';
import { RequestModule } from '../request/request.module';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { MatchingService } from './matching.service';

import { AuthModule } from '../auth/auth.module';
import { RequestCreatedConsumer } from './consumers/request-created.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity]),
    RabbitMqLibModule,
    AuthModule,
    RequestModule,
    DriverModule,
    OrderModule,
  ],
  controllers: [DispatchController],
  providers: [DispatchService, MatchingService, RequestCreatedConsumer],
  exports: [DispatchService],
})
export class DispatchModule {}
