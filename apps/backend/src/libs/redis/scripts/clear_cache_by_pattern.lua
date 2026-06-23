-- clear_cache_by_pattern.lua
-- ===========================
-- Efficiently delete keys matching a pattern using SCAN.
--
-- ARGV[1] = pattern (e.g., 'stats:*')

local cursor = "0"
local deleted_count = 0

repeat
    local result = redis.call("SCAN", cursor, "MATCH", ARGV[1], "COUNT", 100)
    cursor = result[1]
    local keys = result[2]

    if #keys > 0 then
        redis.call("DEL", unpack(keys))
        deleted_count = deleted_count + #keys
    end
until cursor == "0"

return deleted_count
