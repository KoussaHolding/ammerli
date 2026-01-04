import { DispatchService } from '@/api/dispatch/dispatch.service';
import { RequestResDto } from '@/api/request/dto/request.res.dto';
import { RequestStatusEnum } from '@/api/request/enums/request-status.enum';
import { KafkaConsumer, KafkaProcessor } from '@sawayo/kafka-nestjs';
import { EachMessagePayload } from 'kafkajs';

@KafkaProcessor()
export class RequestConsumer {
  constructor(private readonly dispatchService: DispatchService) {}

  @KafkaConsumer({
    subscribe: {
      topics: ['request.created'],
      fromBeginning: true,
    },
    consumerConfig: {
      groupId: 'water-delivery',
    },
  })
  async handleRequestCreated(
    message: RequestResDto,
    payload: EachMessagePayload,
  ) {
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
