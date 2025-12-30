import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redlock from 'redlock';
import { DistributedLockService } from './distributed-lock.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          retryStrategy: (times) => Math.min(times * 50, 2000),
        },
      }),
    }),
  ],
  providers: [
    DistributedLockService,
    // 1. THE REDLOCK FACTORY (The Glue)
    {
      provide: 'REDLOCK_CLIENT',
      inject: [RedisService],
      useFactory: (redisService: RedisService) => {
        // Extract the raw ioredis client from the library
        const client = redisService.getOrThrow();

        // Initialize Redlock with that client
        return new Redlock([client], {
          driftFactor: 0.01,
          retryCount: 10,
          retryDelay: 200,
          retryJitter: 200,
        });
      },
    },
    // 2. RAW CLIENT ALIAS (Compatibility Layer)
    // Allows you to use @Inject('REDIS_CLIENT') in your TrackingService
    // instead of refactoring it to use RedisService.
    {
      provide: 'REDIS_CLIENT',
      inject: [RedisService],
      useFactory: (redisService: RedisService) => {
        return redisService.getOrThrow();
      },
    },
  ],
  exports: [
    RedisModule,
    DistributedLockService,
    'REDLOCK_CLIENT',
    'REDIS_CLIENT', // Export the alias
  ],
})
export class RedisLibModule {}
