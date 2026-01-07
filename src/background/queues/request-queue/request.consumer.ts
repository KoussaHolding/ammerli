import { DispatchService } from '@/api/dispatch/dispatch.service';
import { RequestResDto } from '@/api/request/dto/request.res.dto';
import { RequestStatusEnum } from '@/api/request/enums/request-status.enum';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestConsumer {
  constructor(private readonly dispatchService: DispatchService) {}

  @RabbitSubscribe({
    exchange: 'requests',
    routingKey: 'request.created',
    queue: 'process-request-queue',
  })
  async handleRequestCreated(message: RequestResDto) {
    await this.dispatchService.dispatchRequest({
      id: message.id,
      quantity: message.quantity,
      status: RequestStatusEnum.DISPATCHED,
      type: message.type,
      user: message.user,
      pickupLat: message.pickupLat,
      pickupLng: message.pickupLng,
    });
  }
}
