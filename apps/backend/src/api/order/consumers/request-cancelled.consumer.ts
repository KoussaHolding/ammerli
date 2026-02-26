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
export class RequestCancelledConsumer {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RequestCancelledConsumer.name);
  }

  /**
   * RabbitMQ consumer: listens to request cancelled events and updates order status
   */
  @RabbitSubscribe({
    exchange: RabbitMqExchange.REQUESTS,
    routingKey: RabbitMqRoutingKey.REQUEST_CANCELLED,
    queue: 'request_cancelled_order_queue',
    queueOptions: {
      deadLetterExchange: RabbitMqExchange.DLQ,
      deadLetterRoutingKey: 'dead.letter',
    },
  })
  async handleRequestCancelled(message: RequestResDto) {
    this.logger.log(`Received request.cancelled for requestId: ${message.id}`);

    try {
      await this.orderService.updateStatus(
        message.id as Uuid,
        OrderStatusEnum.CANCELLED,
      );
      this.logger.log(`Order status updated to CANCELLED for requestId: ${message.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to update order status for requestId: ${message.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
