
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType, RequestMethod, ConsoleLogger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/guards/auth.guard';
import { RolesGuard } from '../src/guards/roles.guard';
import { AuthService } from '../src/api/auth/auth.service';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RequestStatusEnum } from './../src/api/request/enums/request-status.enum';
import { TrackingService } from '../src/api/tracking/tracking.service';
import { DriverEntity } from '../src/api/driver/entities/driver.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestTypeEnum } from '../src/api/request/enums/request-type.enum';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// We DO mock OrderService to avoid complexity with Order logic if strictly testing Request flow,
// but for "Real" test, we might want to keep it real too?
// Let's keep OrderService mocked for now to focus on Request/Dispatch flow, 
// or unmock it if we want full integration. 
// Given the user asked for "real tools" (Redis/Rabbit), let's try to minimal mocks.
// However, to keep it simple first, let's just unmock the Infra (Redis/Rabbit).

describe('Request Lifecycle (Real Infra)', () => {
  let app: INestApplication;
  let httpServer: any;
  let driverToken: string;
  let driverUserId: string;
  let driverEntityId: string;
  let userToken: string;
  let createdRequestId: string;
  let trackingService: TrackingService;
  let driverRepo: Repository<DriverEntity>;

  // We can't easily spy on internal socket events without the mock, 
  // so we might need to rely on HTTP polling or just status checks.
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // No Overrides for Redis/Rabbit!
      // We still override TypeOrm to use SQLite from setup-sqlite.ts (via process.env)
      // actually setup-sqlite.ts sets env vars, but AppModule might be using ConfigService.
      // AppModule likely uses ConfigService which reads env vars.
      // So if process.env.DATABASE_TYPE is 'better-sqlite3', AppModule should pick it up 
      // IF the DatabaseConfig logic allows it.
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(new ConsoleLogger());
    
    app.setGlobalPrefix('api', {
      exclude: [{ method: RequestMethod.GET, path: '/' }],
    });
    app.enableVersioning({
      type: VersioningType.URI,
    });

    const reflector = app.get(Reflector);
    const authService = app.get(AuthService);
    app.useGlobalGuards(new AuthGuard(reflector, authService), new RolesGuard(reflector));

    trackingService = app.get(TrackingService);
    driverRepo = app.get(getRepositoryToken(DriverEntity));

    await app.init();
    httpServer = app.getHttpServer();
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Register User', async () => {
    const phone = `+1234567890${Math.floor(Math.random() * 10)}`;
    const res = await request(httpServer)
      .post('/api/v1/auth/phone/register')
      .send({
        phone,
        password: 'password123',
        lastName: 'UserReal',
      })
      .expect(200);
    
    const loginRes = await request(httpServer)
        .post('/api/v1/auth/phone/login')
        .send({ phone, password: 'password123' })
        .expect(200);

    userToken = loginRes.body.accessToken;
  });

  it('2. Register Driver', async () => {
    const phone = `+1987654321${Math.floor(Math.random() * 10)}`;
    await request(httpServer)
      .post('/api/v1/auth/phone/register')
      .send({
        phone,
        password: 'password123',
        firstName: 'Real',
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
    driverUserId = loginRes.body.userId;
    
    // Get driver entity id
    const driver = await driverRepo.findOne({ where: { user: { id: driverUserId as any } } });
    if (!driver) throw new Error('Driver entity not found after registration!');
    driverEntityId = driver.id;
  });

  it('3. Create Request', async () => {
    // Before creating, set driver location and online status
    await trackingService.updateDriverLocation(driverEntityId, 40.7128, -74.0060);
    // Give Redis a tiny moment to process
    await wait(200);

    const res = await request(httpServer)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
            pickupLat: 40.7128,
            pickupLng: -74.0060,
            type: RequestTypeEnum.BYLITER,
            quantity: 5
        })
        .expect(201);
    
    createdRequestId = res.body.id;
    // Real dispatch takes a bit of time (async MQ message)
    // Wait slightly to let RabbitMQ and DispatchService run
    await wait(1000);
  });

  it('4. Driver Accepts Request', async () => {
     await request(httpServer)
        .post(`/api/v1/dispatch/accept`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ requestId: createdRequestId })
        .expect(200);
     
     // Note: Dispatch logic is async via RabbitMQ. 
     // We will verify the status update in the next step via polling.
  });
  
  it('4b. Verify Accepted Status', async () => {
      let found = false;
      for (let i = 0; i < 10; i++) {
        const res = await request(httpServer)
            .get('/api/v1/requests/active') 
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
            
        // Payload is the RequestResDto
        if (res.body && res.body.id === createdRequestId) {
            console.log('Active Request Status:', res.body.status);
            // Status might be ACCEPTED or ARRIVED/IN_PROGRESS depending on logic speed?
            // Usually RequestStatusEnum.ACCEPTED 
            if (res.body.status !== RequestStatusEnum.SEARCHING) {
                found = true;
                break;
            }
        }
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (!found) {
          throw new Error('Request status did not update from SEARCHING within timeout');
      }
  });

  it('5. Driver Arrives', async () => {
     await request(httpServer)
        .post(`/api/v1/requests/${createdRequestId}/arrived`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);
  });

  it('6. Ride Started', async () => {
     await request(httpServer)
        .post(`/api/v1/requests/${createdRequestId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);
  });

  it('7. Ride Completed', async () => {
     await request(httpServer)
        .post(`/api/v1/requests/${createdRequestId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);
  });
});
