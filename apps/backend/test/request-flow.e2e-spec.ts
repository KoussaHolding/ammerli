import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Global, VersioningType, RequestMethod } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/guards/auth.guard';
import { RolesGuard } from '../src/guards/roles.guard';
import { AuthService } from '../src/api/auth/auth.service';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RedisLibsService } from './../src/libs/redis/redis-libs.service';
import { RedisLibsServiceMock } from './mocks/redis.mock';
import { io, Socket } from 'socket.io-client';
import { RequestStatusEnum } from './../src/api/request/enums/request-status.enum';
import { RabbitMqLibModule } from './../src/libs/rabbitMq/rabbitMq.module';
import { RedisLibModule } from './../src/libs/redis/redis.module';
import { RedisScriptService } from './../src/libs/redis/redis-script.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { TypeOrmModule } from '@nestjs/typeorm';

// Deep mock RabbitMQ to prevent connection attempts
jest.mock('@golevelup/nestjs-rabbitmq', () => {
  const mockPublish = jest.fn().mockResolvedValue(true);
  
  class MockAmqpConnection {
    publish = mockPublish;
  }

  class MockRabbitMQModule {
      static forRoot = jest.fn().mockReturnValue({
        module: MockRabbitMQModule,
        providers: [
          {
            provide: MockAmqpConnection,
            useValue: new MockAmqpConnection(),
          },
        ],
        exports: [MockAmqpConnection],
      });

      static forRootAsync = jest.fn().mockReturnValue({
        module: MockRabbitMQModule,
        providers: [
          {
            provide: MockAmqpConnection,
            useValue: new MockAmqpConnection(),
          },
        ],
        exports: [MockAmqpConnection],
      });
  }

  return {
    RabbitMQModule: MockRabbitMQModule,
    AmqpConnection: MockAmqpConnection,
    RabbitSubscribe: () => (target, key, descriptor) => descriptor,
  };
});

// Deep mock BullMQ
jest.mock('@nestjs/bullmq', () => {
  const { Inject } = jest.requireActual('@nestjs/common');
  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
  };
  return {
    BullModule: {
        forRootAsync: jest.fn().mockReturnValue({
            module: class {},
            providers: [],
            exports: [],
        }),
        registerQueue: jest.fn().mockReturnValue({
            module: class {},
            providers: [{
                provide: 'BullQueue_email', 
                useValue: mockQueue,
            }],
            exports: ['BullQueue_email'],
        }),
    },
    InjectQueue: (name: string) => Inject(`BullQueue_${name}`),
    getQueueToken: (name: string) => `BullQueue_${name}`,
  };
});

// Mock internal modules to avoid recursive dependency issues
jest.mock('./../src/libs/rabbitMq/rabbitMq.module', () => {
    class MockAmqpConnection {
        publish = jest.fn().mockResolvedValue(true);
    }
    return {
        RabbitMqLibModule: class {},
        AmqpConnection: MockAmqpConnection, // Export mock class if needed
    };
});

// We still need to override AmqpConnection provider in the test module
// because components inject it by class token.

// Mock Redis Lib Module
jest.mock('./../src/libs/redis/redis.module', () => {
    return {
        RedisLibModule: class {},
    };
});

@Global()
@Module({
  providers: [
    {
      provide: AmqpConnection,
      useClass: AmqpConnection, // This AmqpConnection is the Mock class from jest.mock
    },
  ],
  exports: [AmqpConnection],
})
class MockGlobalRabbitModule {}

@Global()
@Module({
  providers: [
    {
      provide: RedisLibsService,
      useValue: {
        get: jest.fn().mockImplementation(async (key) => {
            console.log(`[RedisLibMock] GET ${key}`);
            return cacheStore.get(key);
        }),
        set: jest.fn().mockImplementation(async (key, value, ttl) => {
            console.log(`[RedisLibMock] SET ${key} (TTL: ${ttl})`);
            cacheStore.set(key, value);
        }),
        del: jest.fn().mockImplementation(async (key) => {
            console.log(`[RedisLibMock] DEL ${key}`);
            cacheStore.delete(key);
        }),
      },
    },
    {
      provide: RedisScriptService,
      useValue: {
        onModuleInit: jest.fn(),
        updateDriverLocation: jest.fn(),
      },
    },
  ],
  exports: [RedisLibsService, RedisScriptService],
})
class MockGlobalRedisModule {}

// Functional Cache Store
const cacheStore = new Map<string, any>();
const mockCacheManager = {
    get: jest.fn().mockImplementation(async (key) => {
        console.log(`[CacheMock] GET ${key}`);
        return cacheStore.get(key);
    }),
    set: jest.fn().mockImplementation(async (key, value) => {
        console.log(`[CacheMock] SET ${key}`);
        cacheStore.set(key, value);
    }),
    del: jest.fn().mockImplementation(async (key) => {
        console.log(`[CacheMock] DEL ${key}`);
        cacheStore.delete(key);
    }),
    store: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        ttl: jest.fn(),
        mset: jest.fn(),
        mget: jest.fn(),
    }
};

import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { DriverService } from './../src/api/driver/driver.service';
import { OrderService } from './../src/api/order/order.service';
import { ConsoleLogger } from '@nestjs/common';
@Global()
@Module({
  providers: [
    {
      provide: OrderService,
      useValue: {
        updateStatus: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue(true),
      },
    },
  ],
  exports: [OrderService],
})
class MockGlobalOrderModule {}

describe('Request Lifecycle (E2E)', () => {
  let app: INestApplication;
  let driverSocket: Socket;
  let userSocket: Socket;
  let httpServer: any;
  let driverToken: string;
  let userToken: string;
  let createdRequestId: string;
  let driverId: string;
  let userId: string;

  // Track received socket events
  const userEvents: string[] = [];
  const driverEvents: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(RabbitMqLibModule)
      .useModule(MockGlobalRabbitModule)
      .overrideModule(RedisLibModule)
      .useModule(MockGlobalRedisModule)
      .overrideProvider(OrderService)
      .useValue({
        updateStatus: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue(true),
        createOrder: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCacheManager)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(new ConsoleLogger());
    
    // Replicate main.ts configuration
    app.setGlobalPrefix('api', {
      exclude: [{ method: RequestMethod.GET, path: '/' }],
    });
    app.enableVersioning({
      type: VersioningType.URI,
    });

    const reflector = app.get(Reflector);
    const authService = app.get(AuthService);
    app.useGlobalGuards(new AuthGuard(reflector, authService), new RolesGuard(reflector));

    await app.init();
    httpServer = app.getHttpServer();
    // Allow address in use errors in tests if running parallel, but Jest runs sequentially by default
    await app.listen(0); // Random port
  });

  afterAll(async () => {
    if (driverSocket) driverSocket.disconnect();
    if (userSocket) userSocket.disconnect();
    await app.close();
  });

  it('1. Register User', async () => {
    const phone = `+1234567890${Math.floor(Math.random() * 10)}`; // Random valid-ish phone
    const res = await request(httpServer)
      .post('/api/v1/auth/phone/register')
      .send({
        phone,
        password: 'password123',
        lastName: 'User',
      })
      .expect(200);
    
    // Login to get token
    const loginRes = await request(httpServer)
        .post('/api/v1/auth/phone/login')
        .send({ phone, password: 'password123' })
        .expect(200);

    console.log('Login Response Body:', JSON.stringify(loginRes.body, null, 2));
    userToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  it('2. Register Driver', async () => {
    const phone = `+1987654321${Math.floor(Math.random() * 10)}`;
    const res = await request(httpServer)
      .post('/api/v1/auth/phone/register')
      .send({
        phone,
        password: 'password123',
        firstName: 'Test',
        lastName: 'Driver',
        role: 'DRIVER',
        driverType: 'MOTORCYCLE'
      })
      .expect(200);

     const loginRes = await request(httpServer)
        .post('/api/v1/auth/phone/login')
        .send({ phone, password: 'password123' })
        .expect(200);

    driverToken = loginRes.body.accessToken;
    const driverUserId = loginRes.body.user.id;
    
    // Fetch the actual Driver Profile ID
    const driverService = app.get(DriverService);
    // Since DriverService.driverRepository is private, we might need to use a public method 
    // or cast to any if no public method exposes finding by User ID.
    // DriverService.findOne takes DriverID, not UserID.
    // DriverService.findAll can filter? No.
    // createProfile returns the driver entity.
    // But we called register via HTTP.
    
    // Hack: use TypeORM repo directly if we can get it, or use `any` cast on service
    // Or just use the repo if we can inject it?
    // Let's try to get Repository<DriverEntity>
    const driverRepo = app.get('DriverEntityRepository'); // Nest usually uses token "DriverEntityRepository" for @InjectRepository(DriverEntity)
    const driver = await driverRepo.findOne({ where: { user: { id: driverUserId } } });
    driverId = driver.id;
  });

  it('3. Connect Sockets', (done) => {
    const port = httpServer.address().port;
    const url = `http://localhost:${port}/tracking`;

    // Connect User
    userSocket = io(url, {
        auth: { token: userToken },
        transports: ['websocket'],
    });

    userSocket.on('connect', () => {
        console.log('User Socket Connected');
    });

    userSocket.onAny((event, ...args) => {
        userEvents.push(event);
    });

    // Connect Driver
    driverSocket = io(url, {
        query: { driverId },
        transports: ['websocket'],
    });

    driverSocket.on('connect', () => {
        console.log('Driver Socket Connected');
    });

    // Give time to connect
    setTimeout(() => {
        expect(userSocket.connected).toBe(true);
        expect(driverSocket.connected).toBe(true);
        done();
    }, 1000);
  });

  it('4. Create Request', async () => {
    const res = await request(httpServer)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
            pickupLat: 40.7128,
            pickupLng: -74.0060,
            type: 'WATER_DELIVERY',
            quantity: 5
        })
        .expect(201);
    
    createdRequestId = res.body.id;
    expect(res.body.status).toBe(RequestStatusEnum.SEARCHING);
    
    // RabbitMQ publish verified via spy if needed
  });

  // Since Dispatch logic often involves async workers (RabbitMQ consumers),
  // we might need to manually trigger the consumer logic or rely on the Mock RabbitMQ
  // if we haven't wired the mock to call consumers.
  // For E2E with mocked RabbitMQ, the message won't actually go to the consumer unless we make the mock emit it.
  // OR we call the Dispatch service directly to simulate "Matching Found".


  it('4b. [RBAC] Client Cannot Accept Request', async () => {
    // Client attempts to accept request (should fail)
    await request(httpServer)
        .post(`/api/v1/dispatch/accept`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ requestId: createdRequestId })
        .expect(403);
  });

  it('5. Driver Accepts Request', async () => {
     // Identify the request
     console.log('Driver Accepting Request ID:', createdRequestId);
     const res = await request(httpServer)
        .post(`/api/v1/dispatch/accept`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ requestId: createdRequestId })
        .expect(200); // Or 201
     
     // Wait for socket event
     await new Promise(r => setTimeout(r, 500));
     expect(userEvents).toContain('request_accepted');
  });

  it('6. Driver Arrives', async () => {
     await request(httpServer)
        .post(`/api/v1/requests/${createdRequestId}/arrived`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

     await new Promise(r => setTimeout(r, 500));
     expect(userEvents).toContain('driver_arrived');
  });

  it('7. Ride Started', async () => {
     await request(httpServer)
        .post(`/api/v1/requests/${createdRequestId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

     await new Promise(r => setTimeout(r, 500));
     expect(userEvents).toContain('ride_started');
  });

  it('8. Ride Completed', async () => {
     await request(httpServer)
        .post(`/api/v1/requests/${createdRequestId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);
     
     await new Promise(r => setTimeout(r, 500));
     expect(userEvents).toContain('request_completed');
  });
});
