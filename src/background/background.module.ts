import { DispatchModule } from '@/api/dispatch/dispatch.module';
import { Module } from '@nestjs/common';

import { RequestConsumer } from './kafka/request.consumer';
import { EmailQueueModule } from './queues/email-queue/email-queue.module';
@Module({
  imports: [EmailQueueModule, DispatchModule],
  providers: [RequestConsumer],
})
export class BackgroundModule {}
