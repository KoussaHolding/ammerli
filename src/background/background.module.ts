import { DispatchModule } from '@/api/dispatch/dispatch.module';
import { Module } from '@nestjs/common';

import { RequestConsumer } from './queues/request-queue/request.consumer';
@Module({
  imports: [DispatchModule],
  providers: [RequestConsumer],
})
export class BackgroundModule {}
