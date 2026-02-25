import { DataSource } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { INestApplication } from '@nestjs/common';

/**
 * Utility class for E2E testing helpers.
 * Handles database cleanup, Redis clearing, and other common test tasks.
 */
export class TestUtils {
  private dataSource: DataSource;
  private redisService: RedisService;

  constructor(private readonly app: INestApplication) {
    this.dataSource = app.get(DataSource);
    this.redisService = app.get(RedisService);
  }

  /**
   * Cleans up the database by truncating all tables except for migrations.
   * @throws {Error} If database cleanup fails.
   */
  async cleanDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
    }
  }

  /**
   * Clears all keys from the Redis cache.
   * @throws {Error} If Redis flush fails.
   */
  async clearRedis(): Promise<void> {
    const client = this.redisService.getOrThrow();
    await client.flushall();
  }

  /**
   * Generates a unique phone number for testing.
   * @returns {string} A unique phone number.
   */
  generateTestPhone(): string {
    return `+21355${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
  }

  /**
   * Creates a test product in the database.
   * @param name - Product name
   * @returns The created ProductEntity
   */
  async createProduct(name: string): Promise<any> {
    const repository = this.dataSource.getRepository('ProductEntity');
    const product = repository.create({
      name,
      description: 'Test Product Description',
      capacityLiters: 1000,
      basePrice: 50.0,
      pricePerKm: 2.5,
      isActive: true,
    });
    return await repository.save(product);
  }
}
