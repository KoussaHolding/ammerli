import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Provider } from '@nestjs/common';
import { Cache } from 'cache-manager';
import Redlock from 'redlock';

export const RedlockProvider: Provider = {
  provide: 'REDLOCK_CLIENT',
  inject: [CACHE_MANAGER],
  useFactory: (cacheManager: Cache) => {
    // Access the underlying Redis client
    const redisClient =
      (cacheManager as any).getClient?.() ?? (cacheManager as any).client;

    return new Redlock([redisClient], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });
  },
};
