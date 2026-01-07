import { Module } from '@nestjs/common';

import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RequestCacheRepository } from './request-cache.repository';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [RedisModule],
  controllers: [RequestController],
  providers: [RequestService, RequestCacheRepository],
  exports: [RequestService],
})
export class RequestModule {}
