import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export class AmqpConnectionMock {
  publish: jest.Mock = jest.fn().mockResolvedValue(true);
}
