import { Module } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

const mockQueue = {
  add: jest.fn(),
  process: jest.fn(),
};

@Module({
  providers: [
    {
      provide: getQueueToken('default'), // Adjust queue name if known
      useValue: mockQueue,
    },
  ],
  exports: [getQueueToken('default')],
})
export class BullModuleMock {}
