export const RedisScripts = {
  UPDATE_DRIVER_LOCATION: {
    file: 'update_driver_location.lua',
  },
} as const;

export type RedisScriptName = keyof typeof RedisScripts;
