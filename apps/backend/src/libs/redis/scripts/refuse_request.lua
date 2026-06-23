-- refuse_request.lua
-- ===================
-- Atomic record of driver refusal and state transition back to searching.
--
-- KEYS[1] = requests:index:{requestId}     (Full Redis key)
--
-- ARGV[1] = driverId
-- ARGV[2] = statusSearching (e.g., 'SEARCHING')
-- ARGV[3] = statusDispatched (e.g., 'DISPATCHED')

local requestData = redis.call('GET', KEYS[1])
if not requestData then
    return -1 -- Request not found
end

local request = cjson.decode(requestData)

if request.status == ARGV[2] or request.status == ARGV[3] then
    -- Initialize refusedDrivers array if it doesn't exist
    if not request.refusedDrivers then
        request.refusedDrivers = {}
    end

    -- Check if driver already in list (Lua tables are 1-indexed)
    local found = false
    for _, id in ipairs(request.refusedDrivers) do
        if id == ARGV[1] then
            found = true
            break
        end
    end

    if not found then
        table.insert(request.refusedDrivers, ARGV[1])
    end

    request.status = ARGV[2]

    local updatedData = cjson.encode(request)
    redis.call('SET', KEYS[1], updatedData, 'KEEPTTL')
    return 1 -- Success
end

return 0 -- Invalid state for refusal
