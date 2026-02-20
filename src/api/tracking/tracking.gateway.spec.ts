import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from 'src/logger/logger.service';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { Socket, Server } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let trackingService: jest.Mocked<TrackingService>;
  let logger: jest.Mocked<AppLogger>;
  let socket: jest.Mocked<Socket>;
  let server: jest.Mocked<Server>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const trackingServiceMock = {
      updateDriverLocation: jest.fn(),
    };
    const loggerMock = {
      setContext: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const jwtServiceMock = {
        verify: jest.fn(),
    };
    const configServiceMock = {
        get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingGateway,
        { provide: TrackingService, useValue: trackingServiceMock },
        { provide: AppLogger, useValue: loggerMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    gateway = module.get<TrackingGateway>(TrackingGateway);
    trackingService = module.get(TrackingService);
    logger = module.get(AppLogger);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    socket = {
      id: 'socket-1',
      handshake: { query: {}, auth: {} },
      data: {},
      disconnect: jest.fn(),
      emit: jest.fn(),
      join: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    gateway.server = server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if no driverId or token', async () => {
      socket.handshake.query = {};
      await gateway.handleConnection(socket);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should join driver room if driverId is present', async () => {
      const driverId = 'driver-1';
      socket.handshake.query = { driverId };
      await gateway.handleConnection(socket);
      expect(socket.data.driverId).toBe(driverId);
      expect(socket.join).toHaveBeenCalledWith(`driver_${driverId}`);
    });

    it('should join user room if valid token is present', async () => {
      const userId = 'user-1';
      const token = 'valid-token';
      socket.handshake.auth = { token };
      jwtService.verify.mockReturnValue({ id: userId });
      configService.get.mockReturnValue('secret');

      await gateway.handleConnection(socket);
      
      expect(socket.data.userId).toBe(userId);
      expect(socket.join).toHaveBeenCalledWith(`user_${userId}`);
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnect for driver', () => {
      const driverId = 'driver-1';
      socket.data = { driverId };
      gateway.handleDisconnect(socket);
      expect(logger.log).toHaveBeenCalledWith(`Driver disconnected: ${driverId}`);
    });
  });

  describe('handleLocationUpdate', () => {
    it('should emit error if driverId is missing in socket data', async () => {
      socket.data = {};
      await gateway.handleLocationUpdate({ lat: 10, lng: 20 }, socket);
      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Connection not identified',
      });
    });

    it('should emit error if payload is invalid', async () => {
      const driverId = 'driver-1';
      socket.data = { driverId };
      await gateway.handleLocationUpdate({ lat: null, lng: 20 } as any, socket);
      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid location payload',
      });
    });

    it('should update location and emit ack on success', async () => {
      const driverId = 'driver-1';
      socket.data = { driverId };
      trackingService.updateDriverLocation.mockResolvedValue(true);

      await gateway.handleLocationUpdate({ lat: 10, lng: 20 }, socket);

      expect(trackingService.updateDriverLocation).toHaveBeenCalledWith(
        driverId,
        10,
        20,
      );
      expect(socket.emit).toHaveBeenCalledWith(
        'location_ack',
        expect.objectContaining({
            driverId,
            updated: true,
        })
      );
    });

    it('should emit error and log on exception', async () => {
      const driverId = 'driver-1';
      socket.data = { driverId };
      const error = new Error('Service failed');
      trackingService.updateDriverLocation.mockRejectedValue(error);

      await gateway.handleLocationUpdate({ lat: 10, lng: 20 }, socket);

      expect(logger.error).toHaveBeenCalledWith(
        `Failed to update location for driver ${driverId}`,
        error.stack,
      );
      expect(socket.emit).toHaveBeenCalledWith('error', {
        driverId,
        message: 'Failed to update location',
        debug: error?.message || String(error),
      });
    });
  });

  describe('sendAlert', () => {
    it('should emit new_alert to driver room', async () => {
        const driverId = 'driver-1';
        const payload = { type: 'NEW_REQUEST' };
        
        await gateway.sendAlert(driverId, payload);
        
        expect(server.to).toHaveBeenCalledWith(`driver_${driverId}`);
        expect(server.emit).toHaveBeenCalledWith('new_alert', payload);
    });

    it('should log error if emit fails', async () => {
        const driverId = 'driver-1';
        const error = new Error('Emit failed');
        server.emit.mockImplementation(() => { throw error; });

        await gateway.sendAlert(driverId, {});
        
        expect(logger.error).toHaveBeenCalledWith(
            `Failed to send alert to driver ${driverId}`,
            error.stack
        );
    });
  });

  describe('handleRequestEvents', () => {
    it('should emit request_accepted to user room', async () => {
        const userId = 'user-1';
        const msg = { status: 'ACCEPTED', user: { id: userId } };
        
        await gateway.handleRequestEvents(msg);

        expect(server.to).toHaveBeenCalledWith(`user_${userId}`);
        expect(server.emit).toHaveBeenCalledWith('request_accepted', msg);
    });

    it('should not emit if status is unknown', async () => {
        const userId = 'user-1';
        const msg = { status: 'UNKNOWN', user: { id: userId } };
        
        await gateway.handleRequestEvents(msg);

        expect(server.to).not.toHaveBeenCalled();
        expect(server.emit).not.toHaveBeenCalled();
    });
    it('should emit ride_started to user room when status is IN_PROGRESS', async () => {
        const userId = 'user-1';
        const msg = { status: 'IN_PROGRESS', user: { id: userId } };
        
        await gateway.handleRequestEvents(msg);

        expect(server.to).toHaveBeenCalledWith(`user_${userId}`);
        expect(server.emit).toHaveBeenCalledWith('ride_started', msg);
    });
  });
});
