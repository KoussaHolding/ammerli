export const dateTimeType =
  process.env.DATABASE_TYPE === 'better-sqlite3' ? 'datetime' : 'timestamptz';
export const dbEnumType =
  process.env.DATABASE_TYPE === 'better-sqlite3' ? 'simple-enum' : 'enum';
