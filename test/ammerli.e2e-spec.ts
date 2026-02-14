import { INestApplication, ValidationPipe, Global, Module, VersioningType, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { io, Socket as ClientSocket } from 'socket.io-client';

import { AppModule } from '../src/app.module';
import { TestUtils } from './test-utils';
import { UserRoleEnum } from '../src/api/user/enums/user-role.enum';
import { RequestStatusEnum } from '../src/api/request/enums/request-status.enum';
import { RequestTypeEnum } from '../src/api/request/enums/request-type.enum';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MailerService } from '@nestjs-modules/mailer';
import { RabbitMqLibModule } from '../src/libs/rabbitMq/rabbitMq.module';
import { AuthService } from '../src/api/auth/auth.service';
import { AuthGuard } from '../src/guards/auth.guard';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';
import { RequestDispatchedConsumer } from '../src/background/queues/request-queue/request.dispatched';

// Global Mock Module to bypass RabbitMQ entirely
@Global()
@Module({
  providers: [
    {
      provide: AmqpConnection,
      useValue: {
        publish: jest.fn().mockResolvedValue(true),
        setupHandlers: jest.fn().mockResolvedValue(true),
      },
    },
  ],
  exports: [AmqpConnection],
})
class MockRabbitMqModule {}

describe('Ammerli API (e2e)', () => {
  let app: INestApplication;
  let testUtils: TestUtils;
  let amqpConnection: AmqpConnection;
  let baseUrl: string;

  const V1_AUTH = '/api/v1/auth';
  const V1_PRODUCTS = '/api/v1/products';
  const REQUESTS = '/api/requests';
  const DISPATCH = '/api/dispatch';

  beforeAll(async () => {
    jest.setTimeout(120000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(RabbitMqLibModule)
      .useModule(MockRabbitMqModule)
      .overrideProvider(MailerService)
      .useValue({
        sendMail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    const reflector = app.get(Reflector);
    const configService = app.get(ConfigService);
    const authService = app.get(AuthService);
    amqpConnection = app.get(AmqpConnection);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalGuards(new AuthGuard(reflector, authService));
    app.useGlobalFilters(new GlobalExceptionFilter(configService));

    await app.listen(0); 
    baseUrl = await app.getUrl();
    testUtils = new TestUtils(app);
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await testUtils.cleanDatabase();
    await testUtils.clearRedis();
    jest.clearAllMocks();
  });

  const createAuthenticatedDriver = async (phone: string) => {
    await request(app.getHttpServer())
      .post(`${V1_AUTH}/phone/register`)
      .send({ phone, firstName: 'Driver', lastName: 'User', password: 'password123', role: UserRoleEnum.DRIVER, driverType: 'WHOLESALE' })
      .expect(res => expect([200, 201]).toContain(res.status));

    const loginRes = await request(app.getHttpServer())
      .post(`${V1_AUTH}/phone/login`)
      .send({ phone, password: 'password123' })
      .expect(200);
      
    return { 
        token: loginRes.body.accessToken, 
        userId: loginRes.body.userId 
    };
  };

  const createAuthenticatedClient = async (phone: string) => {
    await request(app.getHttpServer())
      .post(`${V1_AUTH}/phone/register`)
      .send({ phone, firstName: 'Client', lastName: 'User', password: 'password123', role: UserRoleEnum.CLIENT })
      .expect(res => expect([200, 201]).toContain(res.status));

    const loginRes = await request(app.getHttpServer())
      .post(`${V1_AUTH}/phone/login`)
      .send({ phone, password: 'password123' })
      .expect(200);

    return { 
        token: loginRes.body.accessToken, 
        userId: loginRes.body.userId 
    };
  };

  describe('WebSocket Tracking & Dispatching', () => {
    it('should connect driver, update location, and receive dispatch alert', (done) => {
      let driverSocket: ClientSocket;
      let clientToken: string;
      
      const driverPhone = testUtils.generateTestPhone();
      const clientPhone = testUtils.generateTestPhone();

      (async () => {
        const { userId: driverId } = await createAuthenticatedDriver(driverPhone);
        const { token } = await createAuthenticatedClient(clientPhone);
        clientToken = token;

        const socketUrl = `${baseUrl.replace('[::1]', '127.0.0.1')}/tracking`;
        
        driverSocket = io(socketUrl, {
          query: { driverId },
          transports: ['websocket'],
          forceNew: true,
        });

        driverSocket.on('connect', () => {
           driverSocket.emit('update_location', { lat: 36.75, lng: 3.05 });
        });

        driverSocket.on('connect_error', (err) => done(err));

        driverSocket.on('location_ack', (data) => {
          expect(data.updated).toBe(true);
          
          request(app.getHttpServer())
            .post(REQUESTS)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
              pickupLat: 36.75,
              pickupLng: 3.05,
              quantity: 10,
              type: RequestTypeEnum.BYLITER,
              note: 'Urgent water',
            })
            .expect(201)
            .end(async (err, res) => { 
                if (err) return done(err);
                
                const consumer = app.get(RequestDispatchedConsumer);
                await consumer.handleDispatchedRequest({
                  ...res.body,
                  matchedDrivers: [{ driverId, distanceKm: 0 }]
                });
            });
        });

        driverSocket.on('new_alert', (payload) => {
          expect(payload).toHaveProperty('requestId');
          driverSocket.disconnect();
          done();
        });

        driverSocket.on('error', (err) => done(err));
      })().catch(done);
    });
  });

  describe('Order & Request Lifecycle', () => {
    it('should prevent double acceptance by different drivers', async () => {
      const client = await createAuthenticatedClient(testUtils.generateTestPhone());
      const driver1 = await createAuthenticatedDriver(testUtils.generateTestPhone());
      const driver2 = await createAuthenticatedDriver(testUtils.generateTestPhone());

      const reqRes = await request(app.getHttpServer())
        .post(REQUESTS)
        .set('Authorization', `Bearer ${client.token}`)
        .send({
          pickupLat: 36.75,
          pickupLng: 3.05,
          quantity: 5,
          type: RequestTypeEnum.BYLITER,
        })
        .expect(201);
      
      const reqId = reqRes.body.id;

      await request(app.getHttpServer())
        .post(`${DISPATCH}/accept`)
        .set('Authorization', `Bearer ${driver1.token}`)
        .send({ requestId: reqId })
        .expect(201);

      const failRes = await request(app.getHttpServer())
        .post(`${DISPATCH}/accept`)
        .set('Authorization', `Bearer ${driver2.token}`)
        .send({ requestId: reqId });
      
      expect([400, 404, 403, 409]).toContain(failRes.status);
    });

    it('should sync Request completion to Order delivery status', async () => {
        const client = await createAuthenticatedClient(testUtils.generateTestPhone());
        const driver = await createAuthenticatedDriver(testUtils.generateTestPhone());

        const reqRes = await request(app.getHttpServer())
          .post(REQUESTS)
          .set('Authorization', `Bearer ${client.token}`)
          .send({ pickupLat: 36.75, pickupLng: 3.05, quantity: 1, type: RequestTypeEnum.BYLITER })
          .expect(201);
        
        await request(app.getHttpServer())
          .post(`${DISPATCH}/accept`)
          .set('Authorization', `Bearer ${driver.token}`)
          .send({ requestId: reqRes.body.id })
          .expect(201);

        await request(app.getHttpServer())
          .post(`${REQUESTS}/${reqRes.body.id}/complete`)
          .set('Authorization', `Bearer ${driver.token}`)
          .expect(res => expect([200, 201]).toContain(res.status));

        expect(amqpConnection.publish).toHaveBeenCalledWith(
            'requests', 
            'request.completed', 
            expect.objectContaining({ id: reqRes.body.id, status: RequestStatusEnum.COMPLETED })
        );
    });
  });

  describe('Validation & Errors', () => {
    it('should reject invalid Request payload with 422', async () => {
      const client = await createAuthenticatedClient(testUtils.generateTestPhone());
      
      await request(app.getHttpServer())
        .post(REQUESTS)
        .set('Authorization', `Bearer ${client.token}`)
        .send({
          pickupLat: 1000, 
          quantity: -1,   
        })
        .expect(422);
    });
  });
});
