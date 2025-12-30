import { ErrorCode } from '@/constants/error-code.constant';
import { AppException } from '@/exceptions/app.exception';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(@Inject('REDLOCK_CLIENT') private readonly redlock: Redlock) {}

  /**
   * The "Safe" Pattern (Recommended).
   * Automatically acquires the lock, runs your function, and releases the lock.
   * If the code throws an error, the lock is still released.
   *
   * @param resource The unique key to lock (e.g., "order:12345:process")
   * @param ttl Time in milliseconds before the lock expires automatically
   * @param routine The async function to execute while locked
   * @returns The result of the routine
   */
  async runInLock<T>(
    resource: string,
    ttl: number,
    routine: () => Promise<T>,
  ): Promise<T> {
    try {
      return await this.redlock.using([resource], ttl, async () => {
        this.logger.debug(`Acquired lock: ${resource}`);
        return await routine();
      });
    } catch (error: any) {
      // Differentiate between "Lock Busy" and "Code Error"
      if (this.isLockError(error)) {
        this.logger.warn(`Failed to acquire lock for: ${resource}`);
        throw new AppException(ErrorCode.S001, HttpStatus.TOO_MANY_REQUESTS);
      }

      // If the error came from YOUR code (routine), just rethrow it
      throw error;
    }
  }

  /**
   * Manual Acquire (Advanced).
   * Use this ONLY if the lock needs to be held across different execution contexts
   * or HTTP requests (rare).
   *
   * @param resource Key to lock
   * @param ttl Time in ms
   */
  async acquireLock(resource: string, ttl: number): Promise<Lock> {
    try {
      const lock = await this.redlock.acquire([resource], ttl);
      this.logger.debug(`Manually acquired lock: ${resource}`);
      return lock;
    } catch (error) {
      this.logger.warn(`Failed to manually acquire lock: ${resource}`);
      throw new AppException(ErrorCode.S001, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Manual Release.
   * Only needed if you used acquireLock().
   */
  async releaseLock(lock: Lock): Promise<void> {
    try {
      await lock.release();
      this.logger.debug(`Manually released lock: ${lock.resources.join(', ')}`);
    } catch (error: any) {
      // It is common for release to fail if the lock already expired (TTL).
      // We log this as debug/warn, not error, because the system state is safe (lock is gone).
      this.logger.warn(
        `Lock release skipped (likely expired): ${error.message}`,
      );
    }
  }

  /**
   * Helper to identify Redlock specific errors vs System errors
   */
  private isLockError(error: any): boolean {
    // Redlock throws an object with specific properties or messages depending on version
    return (
      error.name === 'ExecutionError' ||
      (error.message && error.message.includes('could not obtain a lock'))
    );
  }
}
