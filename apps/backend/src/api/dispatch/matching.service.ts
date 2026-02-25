import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/logger/logger.service';
import {
  DriverMetadata,
  DriverMetadataService,
} from '../driver/driver-metadata.service';
import { RequestResDto } from '../request/dto/request.res.dto';
import { Uuid } from '@/common/types/common.type';

interface ScoredCandidate {
  driverId: string;
  score: number;
  metadata: DriverMetadata;
  distanceKm: number;
  debug: Record<string, number>;
}

/**
 * Service that implements the "Fairness & Logic" matching algorithm for driver assignment.
 * Scores candidates based on a weighted multi-criteria decision-making (MCDM) approach.
 *
 * @class MatchingService
 */
@Injectable()
export class MatchingService {
  /**
   * Configurable weights for scoring factors.
   * Total must sum to 1.0 for predictable normalization.
   * @private
   */
  private readonly WEIGHTS = {
    DISTANCE: 0.4, // Proximity to pickup
    IDLE_TIME: 0.3, // Time since last job (higher is better for fairness)
    DAILY_BALANCE: 0.2, // Total jobs today (lower is better for fairness)
    RATING: 0.1, // Driver quality metric
  };

  constructor(
    private readonly driverMetadataService: DriverMetadataService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MatchingService.name);
  }

  /**
   * Ranks a set of driver candidates based on current request context and driver metadata.
   *
   * Algorithm Details:
   * 1. Filtering: Removes drivers who are not 'AVAILABLE' or have missing metadata.
   * 2. Normalization: Scales factors (distance, idle time, jobs) to a 0-1 range.
   * 3. Weighting: Applies the WEIGHTS configuration to produce a final composite score.
   * 4. Sorting: Returns candidates ordered by score descending.
   *
   * @param request - The active request being matched
   * @param candidates - List of [driverId, distanceKm] pairs from geospatial query
   * @returns Array of scored candidates with debug normalization data
   */
  async findBestDrivers(
    request: RequestResDto,
    candidates: [string, string][],
  ): Promise<ScoredCandidate[]> {
    if (!candidates.length) return [];

    const driverIds = candidates.map(([id]) => id);
    const metadataList =
      await this.driverMetadataService.getMetadataForDrivers(driverIds);

    const scoredCandidates: ScoredCandidate[] = [];

    let maxDist = 0;
    let maxIdle = 0;
    let maxDaily = 1;

    const now = Date.now();
    const validMetadata: { meta: DriverMetadata; dist: number }[] = [];

    // Stage 1: Filter and aggregate statistics for normalization
    for (let i = 0; i < candidates.length; i++) {
      const [id, distStr] = candidates[i];
      const dist = parseFloat(distStr);
      const meta = metadataList.find((m) => m.driverId === id);

      if (!meta) continue;

      if (meta.status !== 'AVAILABLE') continue;

      // Filter out drivers who have explicitly refused this request
      if (request.refusedDrivers?.includes(id as Uuid)) continue;

      validMetadata.push({ meta, dist });

      if (dist > maxDist) maxDist = dist;
      const idle = now - meta.lastJobTimestamp;
      if (idle > maxIdle) maxIdle = idle;
      if (meta.dailyJobCount > maxDaily) maxDaily = meta.dailyJobCount;
    }

    if (maxDist === 0) maxDist = 1;
    if (maxIdle === 0) maxIdle = 1;

    // Stage 2: Calculate composite scores
    for (const { meta, dist } of validMetadata) {
      // Normalization Logic:
      // Distance: Closer is better (Invert: 1 - ratio)
      const nDist = 1 - dist / maxDist;

      // Idle Time: Longer wait equals higher priority
      const idleMs = now - meta.lastJobTimestamp;
      const nIdle = idleMs / maxIdle;

      // Daily Balance: Fewer jobs today equals higher priority (Invert: 1 - ratio)
      const nBalance = 1 - meta.dailyJobCount / maxDaily;

      // Rating: Direct linear scale (0-5 to 0-1)
      const nRating = meta.rating / 5.0;

      const score =
        this.WEIGHTS.DISTANCE * nDist +
        this.WEIGHTS.IDLE_TIME * nIdle +
        this.WEIGHTS.DAILY_BALANCE * nBalance +
        this.WEIGHTS.RATING * nRating;

      scoredCandidates.push({
        driverId: meta.driverId,
        score,
        metadata: meta,
        distanceKm: dist,
        debug: { nDist, nIdle, nBalance, nRating },
      });
    }

    return scoredCandidates.sort((a, b) => b.score - a.score);
  }
}
