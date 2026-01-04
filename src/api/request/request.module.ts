import { Module } from '@nestjs/common';

import { KafkaLibModule } from '@/libs/kafka/kafka.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RequestController } from './request.controller';
import { RequestRepository } from './request.repository';
import { RequestService } from './request.service';

@Module({
  imports: [KafkaLibModule, RedisModule],
  controllers: [RequestController],
  providers: [RequestService, RequestRepository],
  exports: [RequestService, RequestRepository],
})
export class RequestModule {}
