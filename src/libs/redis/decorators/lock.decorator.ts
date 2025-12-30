import Redlock from 'redlock';

export interface RedlockOptions {
  key: string;
  ttl: number;
  failStrategy?: 'THROW' | 'SKIP'; // 'SKIP' effectively debounces the call
}

export function UseDistributedLock(options: RedlockOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Access the injected Redlock client from the service instance
      // Assumes the service has: constructor(@Inject('REDLOCK_CLIENT') private readonly redlock: Redlock)
      const redlock: Redlock = (this as any).redlock;

      if (!redlock) {
        throw new Error(
          `Redlock client not found in ${target.constructor.name}. Inject it as 'redlock'.`,
        );
      }

      // Parse dynamic keys (e.g., "driver:{0}")
      let lockKey = options.key;
      args.forEach((arg, index) => {
        lockKey = lockKey.replace(`{${index}}`, String(arg));
      });

      try {
        // The "using" pattern automatically handles release
        return await redlock.using([lockKey], options.ttl, async () => {
          return await originalMethod.apply(this, args);
        });
      } catch (err: any) {
        // Handle "Lock already held" errors
        if (
          err.message?.includes('could not obtain a lock') &&
          options.failStrategy === 'SKIP'
        ) {
          // Log a warning but don't crash the request
          const logger = (this as any).logger; // Assumes your service has a logger
          if (logger)
            logger.warn(`Skipped execution for ${lockKey} - Lock busy`);
          return;
        }
        throw err;
      }
    };

    return descriptor;
  };
}
