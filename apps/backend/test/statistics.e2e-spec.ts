import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType, RequestMethod, Global, Module, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { StatisticsModule } from './../src/api/statistics/statistics.module';
import { UserRoleEnum } from './../src/api/user/enums/user-role.enum';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './../src/api/user/entities/user.entity';
import { OrderEntity } from './../src/api/order/entities/order.entity';
import { RequestEntity } from './../src/api/request/entities/request.entity';
import { ProductEntity } from './../src/api/product/entities/product.entity';
import { AuthGuard } from './../src/guards/auth.guard';
import { RolesGuard } from './../src/guards/roles.guard';
import { AuthModule } from './../src/api/auth/auth.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// Mock high-level modules to prevent any side effects
@Global()
@Module({
  providers: [
    { provide: 'AmqpConnection', useValue: {} },
    { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
  ],
  exports: ['AmqpConnection', CACHE_MANAGER],
})
class MockInfraModule {}

describe('Statistics API (Isolated E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;
  let httpServer: any;

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
      getCount: jest.fn().mockResolvedValue(0),
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'test-secret' }),
        StatisticsModule,
      ],
    })
      .overrideModule(AuthModule)
      .useModule(MockInfraModule)
      .overrideProvider(getRepositoryToken(UserEntity))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(OrderEntity))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(RequestEntity))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(ProductEntity))
      .useValue(mockRepository)
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;
          if (!authHeader) throw new UnauthorizedException();
          const token = authHeader.replace('Bearer ', '');
          const jwtService = app.get(JwtService);
          try {
            const payload = jwtService.verify(token);
            request.user = payload;
            return true;
          } catch (e) {
            return false;
          }
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (ctx) => {
          const req = ctx.switchToHttp().getRequest();
          const user = req.user;
          if (!user) return false;
          
          const reflector = app.get(Reflector);
          const roles = reflector.getAllAndOverride<string[]>('roles', [
            ctx.getHandler(),
            ctx.getClass(),
          ]);
          if (!roles) return true;
          
          return roles.includes(user.role);
        }
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
    httpServer = app.getHttpServer();

    const jwtService = app.get(JwtService);
    
    adminToken = jwtService.sign({ 
      id: 'admin-uuid', 
      role: UserRoleEnum.ADMIN,
      sessionId: 'session-uuid-admin'
    });

    clientToken = jwtService.sign({ 
      id: 'client-uuid', 
      role: UserRoleEnum.CLIENT,
      sessionId: 'session-uuid-client'
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/statistics/dashboard', () => {
    it('should allow ADMIN to access dashboard metrics', async () => {
      const res = await request(httpServer)
        .get('/api/v1/statistics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('orders');
      expect(res.body).toHaveProperty('revenue');
    });

    it('should forbid CLIENT from accessing dashboard metrics', async () => {
      await request(httpServer)
        .get('/api/v1/statistics/dashboard')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(httpServer)
        .get('/api/v1/statistics/dashboard')
        .expect(401); // Real AuthGuard returns 401
    });
  });

  describe('POST /api/v1/statistics/refresh', () => {
    it('should allow ADMIN to refresh cache', async () => {
      await request(httpServer)
        .post('/api/v1/statistics/refresh')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('successfully');
        });
    });

    it('should forbid CLIENT from refreshing cache', async () => {
      await request(httpServer)
        .post('/api/v1/statistics/refresh')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/statistics/report', () => {
    it('should return specific metric for ADMIN', async () => {
      const res = await request(httpServer)
        .get('/api/v1/statistics/report')
        .query({ name: 'users' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('byRole');
    });
  });
});
