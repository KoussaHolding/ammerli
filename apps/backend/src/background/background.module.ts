import { DispatchModule } from '@/api/dispatch/dispatch.module';
import { TrackingModule } from '@/api/tracking/tracking.module';
import { Module } from '@nestjs/common';
@Module({
  imports: [DispatchModule, TrackingModule],
  providers: [],
})
export class BackgroundModule {}
