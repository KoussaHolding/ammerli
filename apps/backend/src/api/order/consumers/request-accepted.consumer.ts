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
export class RequestAcceptedConsumer {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RequestAcceptedConsumer.name);
  }

  /**
   * RabbitMQ consumer: listens to accepted requests and creates an order
   */
  @RabbitSubscribe({
    exchange: RabbitMqExchange.REQUESTS,
    routingKey: RabbitMqRoutingKey.REQUEST_ACCEPTED,
    queue: 'request_accepted_order_queue',
    queueOptions: {
      deadLetterExchange: RabbitMqExchange.DLQ,
      deadLetterRoutingKey: 'dead.letter',
    },
  })
  async handleAcceptedRequest(message: RequestResDto) {
    this.logger.log(`Received request.accepted for requestId: ${message.id}`);

    if (!message.driverId) {
      this.logger.error(`No driverId found for accepted request: ${message.id}`);
      return;
    }

    try {
      await this.orderService.createOrder(
        message.id as Uuid,
        message.driverId as Uuid,
        message.user.id as Uuid,
      );
      this.logger.log(`Order created successfully for requestId: ${message.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to create order for requestId: ${message.id}`,
        error.stack,
      );
      throw error; // Let RabbitMQ handle retry/DLQ
    }
  }
}
