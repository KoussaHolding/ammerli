import { DispatchModule } from '@/api/dispatch/dispatch.module';
import { TrackingModule } from '@/api/tracking/tracking.module';
import { Module } from '@nestjs/common';
import { RequestCreatedConsumer } from './queues/request-queue/request.created';
import { RequestDispatchedConsumer } from './queues/request-queue/request.dispatched';

@Module({
  imports: [DispatchModule, TrackingModule],
  providers: [RequestCreatedConsumer, RequestDispatchedConsumer],
})
export class BackgroundModule {}
