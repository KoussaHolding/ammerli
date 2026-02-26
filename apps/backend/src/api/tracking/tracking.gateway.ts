import { ErrorMessageConstants } from '@/constants/error-code.constant';
import { LogConstants } from '@/constants/log.constant';
import { RabbitMqExchange } from '@/libs/rabbitMq/domain-events';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer, // Import WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'; // Import Server
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
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly trackingService: TrackingService,
    private readonly logger: AppLogger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    if (this.logger) {
      this.logger.setContext(TrackingGateway.name);
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    const { driverId } = client.handshake.query as { driverId?: string };
    const token = client.handshake.auth?.token;

    // 1. Driver Connection
    if (driverId) {
      client.data.driverId = driverId;
      await client.join(`driver_${driverId}`); // Join driver room
      await this.trackingService.setDriverOnline(driverId);
      this.logger.log(`${LogConstants.TRACKING.DRIVER_CONNECTED}: ${driverId}`);
      return;
    }

    // 2. User Connection (via JWT)
    if (token) {
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('auth.secret'),
        });
        const userId = payload.id;
        client.data.userId = userId;
        await client.join(`user_${userId}`); // Join user room
        this.logger.log(`${LogConstants.TRACKING.USER_CONNECTED}: ${userId}`);
        return;
      } catch (error) {
        this.logger.warn(
          `${LogConstants.TRACKING.INVALID_TOKEN}: ${error.message}`,
        );
        client.disconnect();
        return;
      }
    }

    // 3. Unauthorized
    this.logger.warn(LogConstants.TRACKING.CONNECTION_REJECTED);
    client.disconnect();
  }

  handleDisconnect(client: Socket): void {
    const driverId = client.data?.driverId as string | undefined;
    if (driverId) {
      void this.trackingService.setDriverOffline(driverId);
      this.logger.log(
        `${LogConstants.TRACKING.DRIVER_DISCONNECTED}: ${driverId}`,
      );
    }

    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.logger.log(`${LogConstants.TRACKING.USER_DISCONNECTED}: ${userId}`);
    }
  }

  /**
   * Listen to Request events from RabbitMQ and forward to relevant sockets.
   */
  @RabbitSubscribe({
    exchange: RabbitMqExchange.REQUESTS,
    routingKey: ['request.#', 'ride.#'],
    queue: 'tracking_updates_queue', // Durable queue for tracking service
  })
  async handleRequestEvents(msg: any) {
    // msg is the RequestResDto payload

    const userId = msg.user?.id || msg.userId;
    const driverId = msg.driverId;
    const status = msg.status;

    this.logger.log(
      `${LogConstants.TRACKING.PROCESSING_EVENT} ${msg.id}: ${status}`,
    );

    // Forward to User
    if (userId) {
      const eventMap: Record<string, string> = {
        ACCEPTED: 'request_accepted',
        ARRIVED: 'driver_arrived',
        COMPLETED: 'request_completed',
        CANCELLED: 'request_cancelled',
        IN_PROGRESS: 'ride_started',
      };

      const eventName = eventMap[status];
      if (eventName) {
        // Broadcast to all instances
        this.server.to(`user_${userId}`).emit(eventName, msg);
      }
    }

    // Forward to Driver (if needed)
    if (driverId) {
      // Logic for driver updates
    }
  }

  /**
   * Event: 'update_location'
   */
  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const driverId = client.data?.driverId as string | undefined;
    if (!driverId) {
      client.emit('error', {
        message: ErrorMessageConstants.TRACKING.NOT_IDENTIFIED,
      });
      return;
    }

    // Handle clients like Postman that send stringified JSON
    let parsedData = payload;
    if (typeof payload === 'string') {
      try {
        parsedData = JSON.parse(payload);
      } catch (e) {
        // Leave as is, let validation fail
      }
    }

    const { lat, lng } = parsedData ?? {};
    if (lat == null || lng == null) {
      client.emit('error', {
        message: ErrorMessageConstants.TRACKING.INVALID_PAYLOAD,
      });
      return;
    }

    try {
      // 1. Update location in Redis
      if (!this.trackingService) {
        throw new Error(ErrorMessageConstants.TRACKING.SERVICE_NOT_INITIALIZED);
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

      // 2. Broadcast to users?
      // ideally we should only emit to users tracking this driver.
      // But for simple "Uber-like" nearby, drivers are polled via API.
      // Real-time tracking of assigned driver:
      // We need to know which user is assigned to this driver.
      // This state is not in TrackingGateway.
      // We could query Redis "ActiveRequest:User" -> Request -> Driver?
      // Or "ActiveRequest:Driver" -> Request -> User?
      // For now, MVP: we rely on polling for location updates on the map unless we implement full streaming.
      // But user said "gps not working", referring to "Locate" button or map center.
      // Real-time driver pin movement:
      // If we want that, we need to look up the user.
    } catch (error) {
      if (this.logger) {
        this.logger.error(
          `${ErrorMessageConstants.TRACKING.UPDATE_FAILED} for driver ${driverId}`,
          error?.stack,
        );
      }
      client.emit('error', {
        driverId,
        message: ErrorMessageConstants.TRACKING.UPDATE_FAILED,
        debug: error?.message || String(error),
      });
    }
  }

  async sendAlert(driverId: string, payload: unknown): Promise<void> {
    try {
      this.server.to(`driver_${driverId}`).emit('new_alert', payload);
    } catch (error) {
      if (this.logger) {
        this.logger.error(
          `${LogConstants.DRIVER.STALE_REMOVE_FAILED} ${driverId}`,
          error?.stack,
        );
      }
    }
  }
}
