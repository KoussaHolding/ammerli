import { Module } from '@nestjs/common';
import { AwsModule } from './aws/aws.module';
import { KafkaLibModule } from './kafka/kafka.module';
import { RedisLibModule } from './redis/redis.module';

@Module({
  imports: [AwsModule, KafkaLibModule, RedisLibModule],
})
export class LibsModule {}
