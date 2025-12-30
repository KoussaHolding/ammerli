export enum ErrorCode {
  // Common Validation
  V000 = 'common.validation.error',

  // Validation
  V001 = 'user.validation.is_empty',
  V002 = 'user.validation.is_invalid',

  // === DRIVER / DISPATCH DOMAIN ===
  D001 = 'driver.error.not_found', // Driver ID not in Redis
  D002 = 'driver.error.offline', // Driver metadata expired (Ghost)
  D003 = 'driver.error.busy', // Driver locked by another order
  D004 = 'driver.error.too_far', // Driver is outside allowed range

  // Error
  E001 = 'user.error.phone_exists',
  E002 = 'user.error.not_found',
  E003 = 'user.error.email_exists',

  // === SYSTEM / INFRASTRUCTURE ===
  S001 = 'system.error.lock_busy', // Redlock failed to acquire
  S002 = 'system.error.redis_failure', // Redis is down or timed out
}
