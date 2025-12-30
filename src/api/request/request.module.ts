import { Module } from '@nestjs/common';

import { KafkaLibModule } from '@/libs/kafka/kafka.module';
import { UserModule } from '../user/user.module';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [KafkaLibModule, UserModule],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
