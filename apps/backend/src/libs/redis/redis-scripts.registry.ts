export const RedisScripts = {
  UPDATE_DRIVER_LOCATION: {
    file: 'update_driver_location.lua',
  },
  CREATE_REQUEST: {
    file: 'create_request.lua',
  },
  ACCEPT_REQUEST: {
    file: 'accept_request.lua',
  },
  REFUSE_REQUEST: {
    file: 'refuse_request.lua',
  },
  CLEAR_CACHE_BY_PATTERN: {
    file: 'clear_cache_by_pattern.lua',
  },
} as const;

export type RedisScriptName = keyof typeof RedisScripts;
