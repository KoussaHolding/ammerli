import { Module } from '@nestjs/common';
import { RequestModule } from '../request/request.module';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [RequestModule],
  controllers: [],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
