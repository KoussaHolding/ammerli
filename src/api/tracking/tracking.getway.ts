import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AppLogger } from 'src/logger/logger.service';
import { TrackingService } from './tracking.service';

/**
 * WebSocket Gateway for driver location updates and alerts.
 */
@WebSocketGateway({ namespace: '/tracking', cors: true })
@Injectable()
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private activeDrivers = new Map<string, Socket>();

  constructor(
    private readonly trackingService: TrackingService,
    private readonly logger: AppLogger,
  ) {
    if (this.logger) {
      this.logger.setContext(TrackingGateway.name);
    }
  }

  handleConnection(client: Socket): void {
    const { driverId } = client.handshake.query as { driverId?: string };
    if (!driverId) {
      client.disconnect();
      return;
    }
    client.data.driverId = driverId;
    this.activeDrivers.set(driverId, client);
  }

  handleDisconnect(client: Socket): void {
    const driverId = client.data?.driverId as string | undefined;
    if (driverId && this.activeDrivers.get(driverId)?.id === client.id) {
      this.activeDrivers.delete(driverId);
    }
  }

  /**
   * Event: 'update_location'
   */
  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @MessageBody() data: { lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    const driverId = client.data?.driverId as string | undefined;
    if (!driverId) {
       client.emit('error', { message: 'Connection not identified' });
       return;
    }

    const { lat, lng } = data ?? {};
    if (lat == null || lng == null) {
      client.emit('error', { message: 'Invalid location payload' });
      return;
    }

    try {
      // Defensive check for trackingService
      if (!this.trackingService) {
          throw new Error('TrackingService is not initialized');
      }

      const updated = await this.trackingService.updateDriverLocation(
        driverId,
        lat,
        lng,
      );

      client.emit('location_ack', {
        driverId,
        updated,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (this.logger) {
        this.logger.error(
          `Failed to update location for driver ${driverId}`,
          error?.stack,
        );
      }
      client.emit('error', {
        driverId,
        message: 'Failed to update location',
        debug: error?.message || String(error),
      });
    }
  }

  async sendAlert(driverId: string, payload: unknown): Promise<boolean> {
    const client = this.activeDrivers.get(driverId);
    if (!client) return false;

    try {
      client.emit('new_alert', payload);
      return true;
    } catch (error) {
      if (this.logger) {
        this.logger.error(
          `Failed to send alert to driver ${driverId}`,
          error?.stack,
        );
      }
      return false;
    }
  }
}
