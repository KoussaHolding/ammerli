import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ListUserReqDto } from './dto/list-user.req.dto';
import { LoadMoreUsersReqDto } from './dto/load-more-users.req.dto';
import { UpdateUserReqDto } from './dto/update-user.req.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserService } from './user.service';

/**
 * Controller handling user-related API endpoints.
 * Provides functionality for profile management, user listing, and password changes.
 *
 * @version 1
 * @tag users
 */
@ApiTags('users')
@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieves the profile of the currently authenticated user.
   *
   * @param userId - Extracted from the validated JWT token
   * @returns The current user's profile
   */
  @ApiAuth({
    type: UserResDto,
    summary: 'Get current user',
  })
  @Get('me')
  async getCurrentUser(@CurrentUser('id') userId: Uuid): Promise<UserResDto> {
    return await this.userService.findOne(userId);
  }

  /**
   * Lists all users with offset-based pagination.
   *
   * @param reqDto - Filtering and pagination parameters
   * @returns A paginated list of users
   */
  @Get()
  @ApiAuth({
    type: UserResDto,
    summary: 'List users',
    isPaginated: true,
  })
  async findAllUsers(
    @Query() reqDto: ListUserReqDto,
  ): Promise<OffsetPaginatedDto<UserResDto>> {
    return await this.userService.findAll(reqDto);
  }

  /**
   * Fetches users with cursor-based pagination.
   * Optimized for infinite scroll or "load more" UI patterns.
   *
   * @param reqDto - Cursor (after/before) and limit
   * @returns A cursor-paginated list of users
   */
  @Get('/load-more')
  @ApiAuth({
    type: UserResDto,
    summary: 'Load more users',
    isPaginated: true,
    paginationType: 'cursor',
  })
  async loadMoreUsers(
    @Query() reqDto: LoadMoreUsersReqDto,
  ): Promise<CursorPaginatedDto<UserResDto>> {
    return await this.userService.loadMoreUsers(reqDto);
  }

  /**
   * Retrieves a specific user's details by their UUID.
   *
   * @param id - The UUID of the target user
   * @returns The user's profile details
   * @throws {BadRequestException} If ID format is invalid
   * @throws {NotFoundException} If user does not exist
   */
  @Get(':id')
  @ApiAuth({ type: UserResDto, summary: 'Find user by id' })
  @ApiParam({ name: 'id', type: 'String' })
  async findUser(@Param('id', ParseUUIDPipe) id: Uuid): Promise<UserResDto> {
    return await this.userService.findOne(id);
  }

  /**
   * Updates an existing user's profile information.
   *
   * @param id - The UUID of the user to update
   * @param reqDto - Partial user data (bio, image)
   * @returns A promise that resolves when the update is complete
   */
  @Patch(':id')
  @ApiAuth({ type: UserResDto, summary: 'Update user' })
  @ApiParam({ name: 'id', type: 'String' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: Uuid,
    @Body() reqDto: UpdateUserReqDto,
  ) {
    return this.userService.update(id, reqDto);
  }

  /**
   * Soft deletes a user account from the system.
   *
   * @param id - The UUID of the user to delete
   * @returns A promise that resolves upon successful deletion
   */
  @Delete(':id')
  @ApiAuth({
    summary: 'Delete user',
    errorResponses: [400, 401, 403, 404, 500],
  })
  @ApiParam({ name: 'id', type: 'String' })
  removeUser(@Param('id', ParseUUIDPipe) id: Uuid) {
    return this.userService.remove(id);
  }

  /**
   * Initiates the password change process for the current user.
   *
   * @returns A placeholder string for the change-password flow
   * @todo Implement actual password change logic
   */
  @ApiAuth()
  @Post('me/change-password')
  async changePassword() {
    return 'change-password';
  }
}
