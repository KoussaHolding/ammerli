-- update_driver_location.lua
-- ==========================
-- Production-grade driver tracking script
-- Atomic update of:
--   1) Driver geospatial position
--   2) Driver metadata (liveness & last-seen)
--
-- KEYS[1] = drivers:locations              (RedisConstants.KEYS.DRIVERS_GEO_INDEX)
-- KEYS[2] = driver:metadata:{driverId}     (RedisConstants.KEYS.driverMetadata)
--
-- ARGV[1] = longitude
-- ARGV[2] = latitude
-- ARGV[3] = driverId
-- ARGV[4] = timestamp (epoch milliseconds)
-- ARGV[5] = ttl (seconds)                  (RedisConstants.TTL.DRIVER_METADATA_SEC)

-- Fetch last-seen timestamp (if any)
local lastSeen = redis.call('HGET', KEYS[2], 'lastSeen')

-- Drop stale / out-of-order GPS updates
-- Mobile networks may reorder packets
if lastSeen and tonumber(lastSeen) > tonumber(ARGV[4]) then
  return 0
end

-- Update geospatial index
redis.call(
  'GEOADD',
  KEYS[1],
  ARGV[1], -- longitude
  ARGV[2], -- latitude
  ARGV[3]  -- driverId
)

-- Update driver metadata atomically
redis.call(
  'HSET',
  KEYS[2],
  'lastSeen', ARGV[4],
  'lat', ARGV[2],
  'lng', ARGV[1]
)

-- Refresh TTL to maintain online presence
redis.call(
  'EXPIRE',
  KEYS[2],
  ARGV[5]
)

-- Update accepted
return 1
