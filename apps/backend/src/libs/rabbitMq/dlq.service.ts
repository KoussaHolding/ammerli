import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RabbitMqExchange } from './domain-events';

@Injectable()
export class DlqService {
  private readonly logger = new Logger(DlqService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Republish a failed message to the Dead Letter Queue (DLQ).
   * @param originalExchange The exchange where the message failed.
   * @param routingKey The original routing key.
   * @param message The message payload.
   * @param error The error that caused the failure.
   */
  async sendToDlq(
    originalExchange: string,
    routingKey: string,
    message: any,
    error: Error,
  ): Promise<void> {
    try {
      const dlqPayload = {
        originalExchange,
        originalRoutingKey: routingKey,
        error: error.message,
        stack: error.stack,
        failedAt: new Date(),
        payload: message,
      };

      await this.amqpConnection.publish(
        RabbitMqExchange.DLQ,
        'dead.letter', // Generic key for DLQ
        dlqPayload,
      );

      this.logger.warn(
        `Message sent to DLQ: ${routingKey} from ${originalExchange}. Error: ${error.message}`,
      );
    } catch (publishError) {
      this.logger.error(
        `CRITICAL: Failed to publish to DLQ! Original error: ${error.message}`,
        publishError.stack,
      );
    }
  }
}
