export const RedisConstants = {
  // === KEYS & PATTERNS ===
  KEYS: {
    // Exact Keys
    DRIVERS_GEO_INDEX: 'drivers:locations',

    // Key Generators (For use in functions)
    driverMetadata: (driverId: string) => `driver:metadata:${driverId}`,

    // Patterns (For use in @Decorators)
    // We strictly define the pattern string here so it matches the generator logic
    LOCK_DRIVER_UPDATE_PATTERN: 'locks:driver:update:{0}',
  },

  // === TIME TO LIVE (Seconds/Milliseconds) ===
  TTL: {
    DRIVER_METADATA_SEC: 10, // 10 Seconds (Heartbeat)
    LOCK_DRIVER_UPDATE_MS: 2000, // 2 Seconds (Debounce)
    LOCK_DISPATCH_ASSIGN_MS: 3000, // 3 Seconds (Assignment)
  },

  // === REDIS COMMAND OPTIONS ===
  // Prevents typos like 'KMs' or 'withdist'
  CMD: {
    UNIT_KM: 'km' as const,
    WITH_DIST: 'WITHDIST' as const,
    SORT_ASC: 'ASC' as const,
  },
} as const;
