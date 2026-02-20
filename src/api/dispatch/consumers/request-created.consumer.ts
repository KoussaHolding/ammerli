import { DispatchService } from '@/api/dispatch/dispatch.service';
import { RequestResDto } from '@/api/request/dto/request.res.dto';
import { RequestStatusEnum } from '@/api/request/enums/request-status.enum';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

import { RabbitMqExchange, RabbitMqRoutingKey } from '@/libs/rabbitMq/domain-events';

@Injectable()
export class RequestCreatedConsumer {
  constructor(private readonly dispatchService: DispatchService) {}

  @RabbitSubscribe({
    exchange: RabbitMqExchange.REQUESTS,
    routingKey: RabbitMqRoutingKey.REQUEST_CREATED,
    queue: 'process_request_queue',
    queueOptions: {
      deadLetterExchange: RabbitMqExchange.DLQ,
      deadLetterRoutingKey: 'dead.letter',
    },
  })
  async handleDispatch(message: RequestResDto) {
    await this.dispatchService.dispatchRequest({
      id: message.id,
      quantity: message.quantity,
      status: RequestStatusEnum.DISPATCHED,
      type: message.type,
      user: message.user,
      pickupLat: message.pickupLat,
      pickupLng: message.pickupLng,
      driverId: message.driverId ?? null,
    });
  }
}
