export class RedisLibsServiceMock {
  get: jest.Mock = jest.fn().mockResolvedValue(null);
  set: jest.Mock = jest.fn().mockResolvedValue(true);
  del: jest.Mock = jest.fn().mockResolvedValue(true);
  exists: jest.Mock = jest.fn().mockResolvedValue(false);
  
  // Minimal geo support mocked
  geoRadius: jest.Mock = jest.fn().mockResolvedValue([]);
  zrem: jest.Mock = jest.fn().mockResolvedValue(true);

  // Hash support
  hset: jest.Mock = jest.fn().mockResolvedValue(true);
  hgetall: jest.Mock = jest.fn().mockResolvedValue({});
}
