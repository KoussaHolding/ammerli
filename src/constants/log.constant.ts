export const LogConstants = {
  // === DRIVER / DISPATCH DOMAIN ===
  DRIVER: {
    ALERT_SENT: 'Alert sent to driver',
    NOT_CONNECTED: 'Driver not connected, could not send alert',
    NOT_FOUND: 'Driver not found in active pool',
    BUSY: 'Driver currently engaged in another request',
    STALE_REMOVED: 'Removed stale drivers from Redis',
    STALE_REMOVE_FAILED: 'Failed to remove stale drivers',
    FILTER_SUMMARY: 'Filtered active and stale drivers',
    FIND_NEARBY_FAILED: 'Failed to find nearby drivers',
  },

  // === REQUEST DOMAIN ===
  REQUEST: {
    RECEIVED: 'New dispatch request received',
    NO_DRIVERS: 'No drivers found for request',
    CANCELLED: 'Request cancelled by user',
    DISPATCH_SUCCESS: 'Request successfully dispatched to drivers',
    MARK_DISPATCHED: 'Request marked as DISPATCHED',
    ACCEPTED: 'Request accepted by driver',
    EVENT_EMITTED: 'Dispatch event sent for request',
    EVENT_EMIT_FAILED: 'Failed to emit dispatch event for request',
  },

  // === SYSTEM / INFRASTRUCTURE ===
  SYSTEM: {
    REDIS_CONNECTED: 'Successfully connected to Redis',
    LOCK_ACQUIRED: 'Resource lock acquired successfully',
    RETRYING: 'Operation failed, attempting retry',
    REDIS_FAILURE: 'system.error.redis_failure',
    PERFORMANCE_WARNING: 'Performance threshold exceeded',
    // Redis / Locks
    DEBUG_ACQUIRED_LOCK: 'Acquired lock',
    WARN_FAILED_LOCK: 'Failed to acquire lock',
    DEBUG_MANUAL_ACQUIRED_LOCK: 'Manually acquired lock',
    WARN_MANUAL_FAILED_LOCK: 'Failed to manually acquire lock',
    DEBUG_MANUAL_RELEASED_LOCK: 'Manually released lock',
    WARN_LOCK_RELEASE_SKIPPED: 'Lock release skipped (likely expired)',
    WARN_LOCK_BUSY: 'Skipped execution - Lock busy',
    // Scripts
    INFO_INIT_SCRIPTS: 'Initializing Redis scripts',
    ERROR_INIT_SCRIPTS_TIMEOUT: 'Redis script initialization timed out',
    INFO_SCRIPTS_LOADED: 'All Redis scripts loaded successfully',
    ERROR_INIT_SCRIPTS_FAILED: 'Failed to initialize Redis scripts',
    DEBUG_LOADING_SCRIPT: 'Loading Redis script from file',
    ERROR_READ_SCRIPT_FAILED: 'Failed to read script file',
    DEBUG_SCRIPT_LOADED: 'Redis script loaded',
    ERROR_LOAD_SCRIPT_FAILED: 'Failed to load Redis script',
    WARN_NOSCRIPT: 'NOSCRIPT error, reloading script',
    // Instrumentation
    DEBUG_INSTRUMENT_CALL: 'Calling method',
    WARN_INSTRUMENT_PERF: 'PERF WARNING',
    DEBUG_INSTRUMENT_COMPLETED: 'Method completed',
    ERROR_INSTRUMENT_FAILED: 'Method failed',
    // Database
    DB_QUERY: 'query',
    DB_QUERY_FAILED: 'query failed',
    DB_QUERY_ERROR: 'error',
    DB_QUERY_SLOW: 'query is slow',
    DB_QUERY_TIME: 'execution time',
  },
} as const;
