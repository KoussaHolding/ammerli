import { DispatchService } from '@/api/dispatch/dispatch.service';
import { RequestResDto } from '@/api/request/dto/request.res.dto';
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
    console.log(
      await this.dispatchService.findDrivers({
        lat: message.pickupLat,
        lng: message.pickupLng,
        radiusKm: 200000,
      }),
    );
  }
}
