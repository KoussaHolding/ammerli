export const ErrorMessageConstants = {
  VALIDATION: {
    COMMON: {
      CODE: 'common.validation.error',
      DEBUG: 'A common validation error occurred',
    },
    USER_EMPTY: {
      CODE: 'user.validation.is_empty',
      DEBUG: 'User validation: field is empty',
    },
    USER_INVALID: {
      CODE: 'user.validation.is_invalid',
      DEBUG: 'User validation: field is invalid',
    },
  },
  DRIVER: {
    NOT_FOUND: {
      CODE: 'driver.error.not_found',
      DEBUG: 'Driver profile not found in repository or cache',
    },
    OFFLINE: {
      CODE: 'driver.error.offline',
      DEBUG: 'Driver metadata expired (Ghost driver)',
    },
    BUSY: {
      CODE: 'driver.error.busy',
      DEBUG: 'Driver is already locked by another order',
    },
    TOO_FAR: {
      CODE: 'driver.error.too_far',
      DEBUG: 'Driver is outside the allowed matching range',
    },
    NOT_AUTHORIZED: {
      CODE: 'driver.error.not_authorized',
      DEBUG: 'Driver not authorized for this action',
    },
  },
  REQUEST: {
    NOT_FOUND: {
      CODE: 'request.error.not_found',
      DEBUG: 'Request not found in cache',
    },
    NOT_AVAILABLE: {
      CODE: 'request.error.not_available',
      DEBUG: 'Request is not available for acceptance (likely already accepted or expired)',
    },
    ID_NOT_FOUND: (id: string) => ({
      CODE: 'request.error.id_not_found',
      DEBUG: `Request with ID ${id} not found in database`,
    }),
  },
  USER: {
    PHONE_EXISTS: {
      CODE: 'user.error.phone_exists',
      DEBUG: 'User with this phone number already exists',
    },
    NOT_FOUND: {
      CODE: 'user.error.not_found',
      DEBUG: 'User profile not found',
    },
    EMAIL_EXISTS: {
      CODE: 'user.error.email_exists',
      DEBUG: 'User with this email already exists',
    },
  },
  SYSTEM: {
    LOCK_BUSY: {
      CODE: 'system.error.lock_busy',
      DEBUG: 'Redlock failed to acquire resource lock',
    },
    REDIS_FAILURE: {
      CODE: 'system.error.redis_failure',
      DEBUG: 'Redis connection failure or command timeout',
    },
    REDLOCK_CLIENT_NOT_FOUND: {
      CODE: 'system.error.redlock_client_not_found',
      DEBUG: 'Redlock client instance not found',
    },
    REDIS_SCRIPT_NOT_LOADED: {
      CODE: 'system.error.redis_script_not_loaded',
      DEBUG: 'Redis Lua script not found or not loaded',
    },
    UNEXPECTED: {
      CODE: 'common.error.unexpected',
      DEBUG: 'An unexpected application error occurred',
    },
  },
  AUTH: {
    FORBIDDEN: {
      CODE: 'auth.error.forbidden',
      DEBUG: 'User is not authorized to access this resource',
    },
    INVALID_ROLE_DATA: {
      CODE: 'auth.error.invalid_role_data',
      DEBUG: 'Driver type should not be provided for Client role',
    },
  },
  TRACKING: {
    SERVICE_NOT_INITIALIZED: {
      CODE: 'tracking.error.service_not_initialized',
      DEBUG: 'TrackingService is not initialized',
    },
    NOT_IDENTIFIED: {
      CODE: 'tracking.error.not_identified',
      DEBUG: 'Connection not identified',
    },
    INVALID_PAYLOAD: {
      CODE: 'tracking.error.invalid_payload',
      DEBUG: 'Invalid location payload',
    },
    UPDATE_FAILED: {
      CODE: 'tracking.error.update_failed',
      DEBUG: 'Failed to update location',
    },
  },
} as const;

/**
 * Union type of all possible ErrorCode values.
 */
export type ErrorCode = string;
