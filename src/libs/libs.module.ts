import { Module } from '@nestjs/common';
import { AwsModule } from './aws/aws.module';
import { RabbitMqLibModule } from './rabbitMq/rabbitMq.module';
import { RedisLibModule } from './redis/redis.module';

@Module({
  imports: [AwsModule, RabbitMqLibModule, RedisLibModule],
})
export class LibsModule {}
