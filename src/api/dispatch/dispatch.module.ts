import { KafkaLibModule } from '@/libs/kafka/kafka.module';
import { Module } from '@nestjs/common';
import { RequestModule } from '../request/request.module';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [KafkaLibModule, RequestModule],
  controllers: [],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
