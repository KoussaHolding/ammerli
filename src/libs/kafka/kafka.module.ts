import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from '@sawayo/kafka-nestjs';

@Global()
@Module({
  imports: [
    KafkaModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        clientId: configService.get<string>('kafka.clientId'),
        brokers: configService.get<string[]>('kafka.brokers'),
      }),
    }),
  ],
  providers: [],
  exports: [KafkaModule],
})
export class KafkaLibModule {}
