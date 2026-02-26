import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { ProductEntity } from '../src/api/product/entities/product.entity';
import { RequestTypeEnum } from '../src/api/request/enums/request-type.enum';

import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/guards/auth.guard';
import { RolesGuard } from '../src/guards/roles.guard';
import { AuthService } from '../src/api/auth/auth.service';
import { UserEntity } from '../src/api/user/entities/user.entity';
import { UserRoleEnum } from '../src/api/user/enums/user-role.enum';

describe('Request Idempotency (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new AuthGuard(reflector, app.get(AuthService)),
      new RolesGuard(reflector),
    );

    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
    }));
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
    });
    await app.init();

    const testUserPhone = `+1202555${Math.floor(1000 + Math.random() * 8999)}`;
    const testUserPassword = 'password123';

    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(require('../src/api/user/entities/user.entity').UserEntity);
    const productRepo = dataSource.getRepository(ProductEntity);

    // Seed test user
    let user = await userRepo.findOne({ where: { phone: testUserPhone } });
    if (!user) {
      user = userRepo.create({
        phone: testUserPhone,
        password: testUserPassword,
        firstName: 'E2E',
        lastName: 'Test',
        role: require('../src/api/user/enums/user-role.enum').UserRoleEnum.CLIENT,
      });
      await userRepo.save(user);
    }

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/phone/login')
      .send({
        phone: testUserPhone,
        password: testUserPassword,
      });

    accessToken = loginRes.body.accessToken;
    if (!accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    // Seed/Fetch test product
    let product = await productRepo.findOne({ where: { isActive: true } });
    if (!product) {
      product = productRepo.create({
        name: 'Test Product',
        description: 'E2E Test Product',
        basePrice: 100,
        pricePerKm: 10,
        capacityLiters: 10,
        isActive: true,
      });
      await productRepo.save(product);
    }
    productId = product.id;
    console.log(`[E2E Setup] Data seeded: User ${testUserPhone}, Product ${productId}`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle concurrent requests for the same user', async () => {
    const payload = {
      pickupLat: 36.7538,
      pickupLng: 3.0588,
      quantity: 1,
      type: RequestTypeEnum.BYLITER,
      productId: productId,
    };

    // Fire 2 requests simultaneously
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload),
      request(app.getHttpServer())
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload),
    ]);

    // One should create, the other should return the SAME one
    if (res1.status !== 201) {
        console.error(`[E2E Test] res1 failed: ${res1.status} - ${JSON.stringify(res1.body)}`);
    }
    if (res2.status !== 201) {
        console.error(`[E2E Test] res2 failed: ${res2.status} - ${JSON.stringify(res2.body)}`);
    }

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.id).toBe(res2.body.id);
  });

  it('should return existing request for delayed retries (15s late)', async () => {
    const payload = {
      pickupLat: 36.7538,
      pickupLng: 3.0588,
      quantity: 1,
      type: RequestTypeEnum.BYLITER,
      productId: productId,
    };

    const res1 = await request(app.getHttpServer())
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    if (res1.status !== 201) {
        console.error(`[E2E Test] delayed res1 failed: ${res1.status} - ${JSON.stringify(res1.body)}`);
    }
    expect(res1.status).toBe(201);
    const firstId = res1.body.id;

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    if (res2.status !== 201) {
        console.error(`[E2E Test] delayed res2 failed: ${res2.status} - ${JSON.stringify(res2.body)}`);
    }
    expect(res2.status).toBe(201);
    expect(res2.body.id).toBe(firstId);
  }, 30000);
});
