import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from 'src/logger/logger.service';
import { TrackingGateway } from './tracking.getway';
import { TrackingService } from './tracking.service';
import { Socket } from 'socket.io';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let trackingService: jest.Mocked<TrackingService>;
  let logger: jest.Mocked<AppLogger>;
  let socket: jest.Mocked<Socket>;

  beforeEach(async () => {
    const trackingServiceMock = {
      updateDriverLocation: jest.fn(),
    };
    const loggerMock = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingGateway,
        { provide: TrackingService, useValue: trackingServiceMock },
        { provide: AppLogger, useValue: loggerMock },
      ],
    }).compile();

    gateway = module.get<TrackingGateway>(TrackingGateway);
    trackingService = module.get(TrackingService);
    logger = module.get(AppLogger);

    socket = {
      id: 'socket-1',
      handshake: { query: {} },
      data: {},
      disconnect: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if driverId is missing', () => {
      socket.handshake.query = {};
      gateway.handleConnection(socket);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should store driverId and socket if driverId is present', () => {
      const driverId = 'driver-1';
      socket.handshake.query = { driverId };
      gateway.handleConnection(socket);
      expect(socket.data.driverId).toBe(driverId);
      // Access private property for testing if needed, or rely on behavior
      // For now we assume it stores it because we can't easily access the private map without `any` cast
      // casting to any to check private map
      expect((gateway as any).activeDrivers.get(driverId)).toBe(socket);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove driver from active drivers on disconnect', () => {
      const driverId = 'driver-1';
      socket.handshake.query = { driverId };
      gateway.handleConnection(socket);
      expect((gateway as any).activeDrivers.get(driverId)).toBe(socket);

      gateway.handleDisconnect(socket);
      expect((gateway as any).activeDrivers.has(driverId)).toBe(false);
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
      });
    });
  });

  describe('sendAlert', () => {
    it('should return false if driver is not connected', async () => {
        const result = await gateway.sendAlert('unknown-driver', {});
        expect(result).toBe(false);
    });

    it('should send alert and return true if driver is connected', async () => {
        const driverId = 'driver-1';
        socket.handshake.query = { driverId };
        gateway.handleConnection(socket);

        const payload = { type: 'NEW_REQUEST' };
        const result = await gateway.sendAlert(driverId, payload);
        
        expect(result).toBe(true);
        expect(socket.emit).toHaveBeenCalledWith('new_alert', payload);
    });

    it('should return false and log error if emit fails', async () => {
        const driverId = 'driver-1';
        socket.handshake.query = { driverId };
        gateway.handleConnection(socket);
        
        const error = new Error('Emit failed');
        socket.emit.mockImplementation(() => { throw error; });

        const result = await gateway.sendAlert(driverId, {});
        
        expect(result).toBe(false);
        expect(logger.error).toHaveBeenCalledWith(
            `Failed to send alert to driver ${driverId}`,
            error.stack
        );
    });
  });
});
