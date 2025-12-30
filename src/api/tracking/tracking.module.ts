import { RedisLibModule } from '@/libs/redis/redis.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [RedisLibModule],
  providers: [],
  exports: [],
})
export class TrackingModule {}
