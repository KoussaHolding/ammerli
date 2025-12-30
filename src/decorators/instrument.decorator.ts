import { Logger } from '@nestjs/common';

interface InstrumentOptions {
  /** Log a warning if execution takes longer than X ms */
  performanceThreshold?: number;
  /** If true, logs the input arguments (useful for debugging, dangerous for passwords) */
  logArgs?: boolean;
}

export function Instrument(options: InstrumentOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // 1. Capture the original business logic
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 2. Resolve Logger (Duck Typing)
      // We assume the service has "this.logger". If not, we create a temporary one.
      const logger: Logger =
        (this as any).logger || new Logger(target.constructor.name);

      const start = Date.now();

      if (options.logArgs) {
        logger.debug(`Calling ${propertyKey} with: ${JSON.stringify(args)}`);
      }

      try {
        // 3. Execute the actual Logic
        const result = await originalMethod.apply(this, args);

        // 4. Performance Logging
        const duration = Date.now() - start;
        const threshold = options.performanceThreshold || 200; // Default 200ms

        if (duration > threshold) {
          logger.warn(`PERF WARNING: ${propertyKey} took ${duration}ms`);
        } else {
          // Optional: You can comment this out if you want "Silence on Success"
          logger.debug(`${propertyKey} completed in ${duration}ms`);
        }

        return result;
      } catch (error) {
        // 5. Error Logging (The logic you wanted to hide)
        const duration = Date.now() - start;
        logger.error(
          `FAILED: ${propertyKey} after ${duration}ms. Error: ${error.message}`,
          error.stack,
        );
        // Rethrow so the Exception Filter or Controller handles the response
        throw error;
      }
    };

    return descriptor;
  };
}
