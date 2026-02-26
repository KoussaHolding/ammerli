import { OrderStatusEnum } from '@/api/order/entities/order.entity';
import { RequestResDto } from '@/api/request/dto/request.res.dto';
import {
  RabbitMqExchange,
  RabbitMqRoutingKey,
} from '@/libs/rabbitMq/domain-events';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/logger/logger.service';
import { Uuid } from '@/common/types/common.type';
import { OrderService } from '../order.service';

@Injectable()
export class RideStartedConsumer {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RideStartedConsumer.name);
  }

  /**
   * RabbitMQ consumer: listens to ride started events and updates order status
   */
  @RabbitSubscribe({
    exchange: RabbitMqExchange.REQUESTS,
    routingKey: RabbitMqRoutingKey.RIDE_STARTED,
    queue: 'ride_started_order_queue',
    queueOptions: {
      deadLetterExchange: RabbitMqExchange.DLQ,
      deadLetterRoutingKey: 'dead.letter',
    },
  })
  async handleRideStarted(message: RequestResDto) {
    this.logger.log(`Received ride.started for requestId: ${message.id}`);

    try {
      await this.orderService.updateStatus(
        message.id as Uuid,
        OrderStatusEnum.PICKED_UP,
      );
      this.logger.log(`Order status updated to PICKED_UP for requestId: ${message.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to update order status for requestId: ${message.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
