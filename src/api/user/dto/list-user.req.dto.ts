import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';

/**
 * Request DTO for listing users with offset-based pagination.
 * Inherits standard page options (page, limit, order).
 */
export class ListUserReqDto extends PageOptionsDto {}
