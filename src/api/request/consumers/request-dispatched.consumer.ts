import { RequestResDto } from '@/api/request/dto/request.res.dto';
import { DriverLocationResDto } from '@/api/tracking/dto/driver-location.res.dto';
import { TrackingGateway } from '@/api/tracking/tracking.gateway';
import { LogConstants } from '@/constants/log.constant';
import {
  RabbitMqExchange,
  RabbitMqRoutingKey,
} from '@/libs/rabbitMq/domain-events';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/logger/logger.service';

@Injectable()
export class RequestDispatchedConsumer {
  constructor(
    private readonly trackingGateway: TrackingGateway,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RequestDispatchedConsumer.name);
  }

  /**
   * RabbitMQ consumer: listens to dispatched requests
   */
  @RabbitSubscribe({
    exchange: RabbitMqExchange.REQUESTS,
    routingKey: RabbitMqRoutingKey.REQUEST_DISPATCHED,
    queue: 'request_dispatched_queue',
    queueOptions: {
      deadLetterExchange: RabbitMqExchange.DLQ,
      deadLetterRoutingKey: 'dead.letter',
    },
  })
  async handleDispatchedRequest(
    message: RequestResDto & { matchedDrivers: DriverLocationResDto[] },
  ) {
    await this.notifyDrivers(message.matchedDrivers, message);
  }

  /**
   * Notify drivers via TrackingGateway
   */
  private async notifyDrivers(
    drivers: DriverLocationResDto[],
    request: RequestResDto,
  ) {
    if (!drivers || !drivers.length) return;

    for (const driver of drivers) {
      await this.trackingGateway.sendAlert(driver.driverId, {
        requestId: request.id,
        type: request.type,
        quantity: request.quantity,
        location: { lat: request.pickupLat, lng: request.pickupLng },
      });

      this.logger.infoStructured(LogConstants.DRIVER.ALERT_SENT, {
        driverId: driver.driverId,
        requestId: request.id,
      });
    }
  }
}
