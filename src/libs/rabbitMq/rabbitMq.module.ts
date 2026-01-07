import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: process.env.RABBITMQ_EXCHANGE || 'requests',
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
  providers: [],
  exports: [RabbitMQModule],
})
export class RabbitMqLibModule {}
