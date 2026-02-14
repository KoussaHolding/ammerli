import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DriverModule } from './driver/driver.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { UserModule } from './user/user.module';

import { RequestModule } from '@/api/request/request.module';
import { TrackingModule } from '@/api/tracking/tracking.module';
import { ClientModule } from './client/client.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { ProductModule } from './product/product.module';
import { NotificationModule } from '@/api/notification/notification.module';
import { RatingModule } from '@/api/rating/rating.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    UserModule,
    HealthModule,
    AuthModule,
    HomeModule,
    DriverModule,
    ClientModule,
    TrackingModule,
    RequestModule,
    DispatchModule,
    ProductModule,
    NotificationModule,
    RatingModule,
    OrderModule,
  ],
})
export class ApiModule {}
