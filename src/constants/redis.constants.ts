export const RedisConstants = {
  KEYS: {
    DRIVERS_GEO_INDEX: 'drivers:locations',
    driverMetadata: (driverId: string) => `driver:metadata:${driverId}`,
    LOCK_DRIVER_UPDATE_PATTERN: 'locks:driver:update:{0}',
    REQUESTS_INDEX: 'requests',
  },
  TTL: {
    DRIVER_METADATA_SEC: 100,
    LOCK_DRIVER_UPDATE_MS: 2000,
    LOCK_DISPATCH_ASSIGN_MS: 3000,
  },
  CMD: {
    UNIT_KM: 'km' as const,
    WITH_DIST: 'WITHDIST' as const,
    SORT_ASC: 'ASC' as const,
  },
} as const;
