import { DriverMetadata, DriverMetadataService } from '../driver/driver-metadata.service';
import { RequestResDto } from '../request/dto/request.res.dto';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/logger/logger.service';
import { RequestStatusEnum } from '../request/enums/request-status.enum';

interface ScoredCandidate {
  driverId: string;
  score: number;
  metadata: DriverMetadata;
  distanceKm: number;
  debug: Record<string, number>;
}

@Injectable()
export class MatchingService {
  // Configurable Weights
  private readonly WEIGHTS = {
    DISTANCE: 0.4,
    IDLE_TIME: 0.3,
    DAILY_BALANCE: 0.2,
    RATING: 0.1,
  };

  constructor(
    private readonly driverMetadataService: DriverMetadataService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MatchingService.name);
  }

  /**
   * Sorts drivers based on "Fairness & Logic" score.
   */
  async findBestDrivers(
    request: RequestResDto,
    candidates: [string, string][], // [driverId, distance][]
  ): Promise<ScoredCandidate[]> {
    if (!candidates.length) return [];

    const driverIds = candidates.map(([id]) => id);
    const metadataList = await this.driverMetadataService.getMetadataForDrivers(driverIds);

    const scoredCandidates: ScoredCandidate[] = [];

    // Pre-calculate max values for normalization
    let maxDist = 0;
    let maxIdle = 0;
    let maxDaily = 1; // Avoid div by zero

    const now = Date.now();

    const validMetadata: { meta: DriverMetadata; dist: number }[] = [];

    // 1. Filter & Collect Stats
    for (let i = 0; i < candidates.length; i++) {
        const [id, distStr] = candidates[i];
        const dist = parseFloat(distStr);
        const meta = metadataList.find(m => m.driverId === id);

        if (!meta) continue;
        
        // --- LOGIC CONSTRAINTS ---
        // 1. Must be AVAILABLE
        if (meta.status !== 'AVAILABLE') continue;
        
        // 2. Vehicle Check (stub: assume vehicleType matches request if present)
        // if (request.vehicleType && meta.vehicleType !== request.vehicleType) continue;

        validMetadata.push({ meta, dist });

        if (dist > maxDist) maxDist = dist;
        const idle = now - meta.lastJobTimestamp;
        if (idle > maxIdle) maxIdle = idle;
        if (meta.dailyJobCount > maxDaily) maxDaily = meta.dailyJobCount;
    }

    if (maxDist === 0) maxDist = 1;
    if (maxIdle === 0) maxIdle = 1;

    // 2. Score Drivers
    for (const { meta, dist } of validMetadata) {
        // Normalize (0 to 1)
        // Distance: Closer is better (1 - normalized_dist)
        const nDist = 1 - (dist / maxDist);
        
        // Idle: Longer is better (normalized_idle)
        const idleMs = now - meta.lastJobTimestamp;
        const nIdle = idleMs / maxIdle;

        // Daily Balance: Fewer jobs is better (1 - normalized_jobs)
        const nBalance = 1 - (meta.dailyJobCount / maxDaily);

        // Rating: Higher is better (val / 5)
        const nRating = meta.rating / 5.0;

        const score = 
            (this.WEIGHTS.DISTANCE * nDist) +
            (this.WEIGHTS.IDLE_TIME * nIdle) +
            (this.WEIGHTS.DAILY_BALANCE * nBalance) +
            (this.WEIGHTS.RATING * nRating);

        scoredCandidates.push({
            driverId: meta.driverId,
            score,
            metadata: meta,
            distanceKm: dist,
            debug: { nDist, nIdle, nBalance, nRating }
        });
    }

    // Sort Descending by Score
    return scoredCandidates.sort((a, b) => b.score - a.score);
  }
}
