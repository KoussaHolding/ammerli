export const ErrorMessageConstants = {
  VALIDATION: {
    COMMON: 'common.validation.error',
    USER_EMPTY: 'user.validation.is_empty',
    USER_INVALID: 'user.validation.is_invalid',
  },
  DRIVER: {
    NOT_FOUND: 'driver.error.not_found',
    OFFLINE: 'driver.error.offline',
    BUSY: 'driver.error.busy',
    TOO_FAR: 'driver.error.too_far',
    NOT_AUTHORIZED: 'driver.error.not_authorized',
  },
  REQUEST: {
    NOT_FOUND: 'request.error.not_found',
    NOT_AVAILABLE: 'request.error.not_available',
    ID_NOT_FOUND: 'request.error.id_not_found',
  },
  USER: {
    PHONE_EXISTS: 'user.error.phone_exists',
    NOT_FOUND: 'user.error.not_found',
    EMAIL_EXISTS: 'user.error.email_exists',
  },
  SYSTEM: {
    LOCK_BUSY: 'system.error.lock_busy',
    REDIS_FAILURE: 'system.error.redis_failure',
    REDLOCK_CLIENT_NOT_FOUND: 'system.error.redlock_client_not_found',
    REDIS_SCRIPT_NOT_LOADED: 'system.error.redis_script_not_loaded',
    UNEXPECTED: 'common.error.unexpected',
  },
  AUTH: {
    FORBIDDEN: 'auth.error.forbidden',
    INVALID_ROLE_DATA: 'auth.error.invalid_role_data',
  },
  TRACKING: {
    SERVICE_NOT_INITIALIZED: 'tracking.error.service_not_initialized',
    NOT_IDENTIFIED: 'tracking.error.not_identified',
    INVALID_PAYLOAD: 'tracking.error.invalid_payload',
    UPDATE_FAILED: 'tracking.error.update_failed',
  },
} as const;

/**
 * Union type of all possible ErrorCode values.
 */
export type ErrorCode = string;
