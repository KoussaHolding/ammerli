import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { DlqService } from './dlq.service';
import { RabbitMqExchange } from './domain-events';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: RabbitMqExchange.REQUESTS,
          type: 'topic',
        },
        {
          name: RabbitMqExchange.TRACKING,
          type: 'topic',
        },
        {
          name: RabbitMqExchange.NOTIFICATIONS,
          type: 'topic',
        },
        {
          name: RabbitMqExchange.DLQ,
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      connectionInitOptions: { wait: true, timeout: 5000 },
      enableControllerDiscovery: true,
      channels: {
        default: {
          prefetchCount:
            parseInt(process.env.RABBITMQ_PREFETCH_COUNT, 10) || 10,
          default: true,
        },
        highThroughput: {
          prefetchCount: parseInt(process.env.RABBITMQ_HIGH_PREFETCH, 10) || 50,
        },
      },
    }),
  ],
  providers: [DlqService],
  exports: [RabbitMQModule, DlqService],
})
export class RabbitMqLibModule {}
