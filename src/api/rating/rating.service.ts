import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RatingEntity } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RequestEntity } from '@/api/request/entities/request.entity';
import { DriverMetadataService } from '@/api/driver/driver-metadata.service';
import { AppLogger } from '@/logger/logger.service';
import { Uuid } from '@/common/types/common.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestStatusEnum } from '@/api/request/enums/request-status.enum';
import { DriverEntity } from '@/api/driver/entities/driver.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(RatingEntity)
    private readonly ratingRepo: Repository<RatingEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    private readonly driverMetadataService: DriverMetadataService,
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(RatingService.name);
  }

  async create(reviewerId: string, dto: CreateRatingDto) {
    // 1. Validate Request
    const request = await this.requestRepo.findOne({
      where: { id: dto.requestId as Uuid },
      relations: ['driver', 'user'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.userId !== reviewerId) {
      throw new BadRequestException('You can only rate your own requests');
    }

    if (request.status !== RequestStatusEnum.COMPLETED) { 
      throw new BadRequestException('Request is not completed yet');
    }

    // Check if already rated
    const existing = await this.ratingRepo.findOne({ where: { requestId: dto.requestId as Uuid } });
    if (existing) {
      throw new BadRequestException('Request already rated');
    }

    if (!request.driverId) {
        throw new BadRequestException('No driver associated with this request');
    }

    // 2. Create Rating Transactionally (Update Driver Metadata too)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const rating = this.ratingRepo.create({
        rating: dto.rating,
        comment: dto.comment,
        reviewerId: reviewerId as Uuid,
        targetId: request.driverId as Uuid,
        requestId: dto.requestId as Uuid,
      });

      await queryRunner.manager.save(rating);

      // 3. Update Driver Metadata (Rating System)
      // Calculate new average
      const result = await queryRunner.manager
        .createQueryBuilder(RatingEntity, 'r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(r.id)', 'count')
        .where('r.targetId = :driverId', { driverId: request.driverId })
        .getRawOne();
      
      const avg = result ? result.avg : null;
      const count = result ? result.count : 0;
      
      const newRating = avg ? parseFloat(avg) : dto.rating;

      await this.driverMetadataService.updateMetadata(request.driverId, { 
          rating: newRating,
          dailyJobCount: undefined // We don't update job count here, strictly speaking. Matching service logic probably updates it elsewhere.
      });

      // Update Driver Entity (Postgres)
      await queryRunner.manager.update(DriverEntity, request.driverId, {
          rating: newRating,
          // totalJobs: count // Optional: update total jobs if reliable
      });

      await queryRunner.commitTransaction();

      this.logger.log(`Rating created for request ${dto.requestId}`);
      return rating;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create rating', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getDriverRatings(driverId: string) {
    return await this.ratingRepo.find({
      where: { targetId: driverId as Uuid },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      take: 20, // Limit to recent 20
    });
  }
}
