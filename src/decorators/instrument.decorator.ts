import { Logger } from '@nestjs/common';

interface InstrumentOptions {
  performanceThreshold?: number;
  logArgs?: boolean;
}

export function Instrument(options: InstrumentOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger: Logger =
        (this as any).logger || new Logger(target.constructor.name);

      const start = Date.now();

      if (options.logArgs) {
        logger.debug(`Calling ${propertyKey} with: ${JSON.stringify(args)}`);
      }

      try {
        const result = await originalMethod.apply(this, args);

        const duration = Date.now() - start;
        const threshold = options.performanceThreshold || 200; // Default 200ms

        if (duration > threshold) {
          logger.warn(`PERF WARNING: ${propertyKey} took ${duration}ms`);
        } else {
          logger.debug(`${propertyKey} completed in ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(
          `FAILED: ${propertyKey} after ${duration}ms. Error: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
