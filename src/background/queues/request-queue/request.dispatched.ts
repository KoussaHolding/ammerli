import { RequestResDto } from '@/api/request/dto/request.res.dto';
import { DriverLocationResDto } from '@/api/tracking/dto/driver-location.res.dto';
import { TrackingGateway } from '@/api/tracking/tracking.getway';
import { LogConstants } from '@/constants/log.constant';
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
    exchange: 'requests',
    routingKey: 'request.dispatched',
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
      const sent = await this.trackingGateway.sendAlert(driver.driverId, {
        requestId: request.id,
        type: request.type,
        quantity: request.quantity,
        location: { lat: request.pickupLat, lng: request.pickupLng },
      });

      if (sent) {
        this.logger.infoStructured(LogConstants.DRIVER.ALERT_SENT, {
          driverId: driver.driverId,
          requestId: request.id,
        });
      } else {
        this.logger.warnStructured(LogConstants.DRIVER.NOT_CONNECTED, {
          driverId: driver.driverId,
          requestId: request.id,
        });
      }
    }
  }
}
