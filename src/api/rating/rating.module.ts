import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingEntity } from './entities/rating.entity';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { RequestEntity } from '@/api/request/entities/request.entity';
import { DriverMetadataService } from '@/api/driver/driver-metadata.service'; // Ensure this is exported or provide module
import { DriverModule } from '@/api/driver/driver.module';

// I need to check if DriverMetadataService is in DriverModule or its own module.
// Based on file structure, it's in src/api/driver/driver-metadata.service.ts
// It's likely part of DriverModule.

@Module({
  imports: [
    TypeOrmModule.forFeature([RatingEntity, RequestEntity]),
    DriverModule, 
    EventEmitterModule.forRoot(),
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
