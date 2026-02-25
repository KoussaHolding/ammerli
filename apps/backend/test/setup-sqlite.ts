// Force SQLite for E2E tests
process.env.DATABASE_TYPE = 'better-sqlite3';
process.env.DATABASE_NAME = ':memory:';
process.env.DATABASE_SYNCHRONIZE = 'true';
process.env.DATABASE_DROP_SCHEMA = 'true';
process.env.DATABASE_LOGGING = 'false';

// Disable other services config if needed (or provide defaults)
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
