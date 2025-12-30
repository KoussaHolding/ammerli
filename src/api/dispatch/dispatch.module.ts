import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';

@Module({
  controllers: [],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
