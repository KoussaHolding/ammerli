import { SelectQueryBuilder } from 'typeorm';
import { FilterDto } from '../common/dto/filter.dto';

interface FilterConfig {
  /**
   * List of entity columns that the generic 'search' field should apply to via ILIKE.
   * e.g. ['entity.firstName', 'entity.lastName', 'entity.email']
   */
  searchColumns?: string[];
}

/**
 * Dynamically applies filters from a FilterDto to a TypeORM SelectQueryBuilder.
 * This ensures standardized, secure filtering across all entities.
 *
 * @param builder TypeORM SelectQueryBuilder instance
 * @param dto The filter parameters parsed from the request
 * @param config Configuration specifying how to map generic filters (like search)
 * @returns The modified SelectQueryBuilder
 */
export function applyFiltersToQueryBuilder<T>(
  builder: SelectQueryBuilder<T>,
  dto: FilterDto,
  config?: FilterConfig,
): SelectQueryBuilder<T> {
  // Extract table alias used in query builder to properly format generic date filters
  const alias = builder.expressionMap.mainAlias?.name;

  if (!alias) {
    throw new Error('QueryBuilder must operate on an alias.');
  }

  if (dto.search && config?.searchColumns?.length) {
    // Generate an OR group for all search columns using ILIKE
    builder.andWhere(
      `(${config.searchColumns.map((col) => `${col} ILIKE :search`).join(' OR ')})`,
      { search: `%${dto.search}%` },
    );
  }

  if (dto.createdAtGte) {
    builder.andWhere(`${alias}.createdAt >= :createdAtGte`, {
      createdAtGte: dto.createdAtGte,
    });
  }

  if (dto.createdAtLte) {
    builder.andWhere(`${alias}.createdAt <= :createdAtLte`, {
      createdAtLte: dto.createdAtLte,
    });
  }

  // Iterate over other remaining DTO keys to auto-apply exact-match OR IN-clause filters
  // Ignoring the standard properties already handled above or related to pagination
  const ignoredKeys = [
    'search',
    'createdAtGte',
    'createdAtLte',
    'page',
    'limit',
    'offset',
    'order',
    'orderBy',
    'skip',
    'take'
  ];

  for (const [key, value] of Object.entries(dto)) {
    if (!ignoredKeys.includes(key) && value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array values as IN clauses (e.g. status[]=PENDING&status[]=ACTIVE)
        builder.andWhere(`${alias}.${key} IN (:...${key})`, { [key]: value });
      } else {
        // Handle exact matches
        builder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
      }
    }
  }

  return builder;
}
