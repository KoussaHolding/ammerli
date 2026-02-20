import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { ErrorCode, ErrorMessageConstants } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { buildPaginator } from '@/utils/cursor-pagination';
import { paginate } from '@/utils/offset-pagination';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import assert from 'assert';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { ListUserReqDto } from './dto/list-user.req.dto';
import { LoadMoreUsersReqDto } from './dto/load-more-users.req.dto';
import { UpdateUserReqDto } from './dto/update-user.req.dto';
import { UserResDto } from './dto/user.res.dto';
import { UserEntity } from './entities/user.entity';

/**
 * Service responsible for managing user-related business logic.
 * Handles user creation, profile updates, and various pagination strategies.
 *
 * @interface UserService
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Creates a new user in the system.
   * Performs uniqueness checks and initializes system metadata.
   *
   * @param dto - Data transfer object containing user registration details
   * @returns The newly created user as a UserResDto
   * @throws {ValidationException} If the phone number is already registered
   *
   * @example
   * const user = await userService.create({ phone: '+1234567890', password: 'securePassword', ... });
   */
  async create(dto: CreateUserReqDto): Promise<UserResDto> {
    const { phone, password, bio, image } = dto;

    const user = await this.userRepository.findOne({
      where: [
        {
          phone,
        },
      ],
    });

    if (user) {
      throw new ValidationException(ErrorMessageConstants.USER.PHONE_EXISTS.CODE);
    }

    const newUser = new UserEntity({
      phone,
      password,
      bio,
      image,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      ...dto,
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.debug(savedUser);

    return plainToInstance(UserResDto, savedUser);
  }

  /**
   * Retrieves a paginated list of users using offset-based pagination.
   *
   * @param reqDto - Pagination and filtering parameters
   * @returns An OffsetPaginatedDto containing the list of users and metadata
   *
   * @example
   * const { data, meta } = await userService.findAll({ page: 1, limit: 10 });
   */
  async findAll(
    reqDto: ListUserReqDto,
  ): Promise<OffsetPaginatedDto<UserResDto>> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');
    const [users, metaDto] = await paginate<UserEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
    return new OffsetPaginatedDto(plainToInstance(UserResDto, users), metaDto);
  }

  /**
   * Fetches users using cursor-based pagination for smooth "load more" functionality.
   *
   * @param reqDto - Cursor pagination parameters (limit, cursor)
   * @returns A CursorPaginatedDto containing users and pagination cursors
   *
   * @example
   * const results = await userService.loadMoreUsers({ limit: 20, afterCursor: '...' });
   */
  async loadMoreUsers(
    reqDto: LoadMoreUsersReqDto,
  ): Promise<CursorPaginatedDto<UserResDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const paginator = buildPaginator({
      entity: UserEntity,
      alias: 'user',
      paginationKeys: ['createdAt'],
      query: {
        limit: reqDto.limit,
        order: 'DESC',
        afterCursor: reqDto.afterCursor,
        beforeCursor: reqDto.beforeCursor,
      },
    });

    const { data, cursor } = await paginator.paginate(queryBuilder);

    const metaDto = new CursorPaginationDto(
      data.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      reqDto,
    );

    return new CursorPaginatedDto(plainToInstance(UserResDto, data), metaDto);
  }

  /**
   * Finds a single user by their unique identifier.
   *
   * @param id - The UUID of the user to find
   * @returns The user data transfer object
   * @throws {EntityNotFoundError} If the user does not exist
   * @throws {AssertionError} If the ID is not provided
   *
   * @example
   * const user = await userService.findOne('uuid-string');
   */
  async findOne(id: Uuid): Promise<UserResDto> {
    assert(id, 'id is required');
    const user = await this.userRepository.findOneByOrFail({ id });

    return user.toDto(UserResDto);
  }

  /**
   * Updates partial user profile information.
   *
   * @param id - UUID of the user to update
   * @param updateUserDto - Data to update (bio, image)
   * @throws {EntityNotFoundError} If the user is not found
   *
   * @example
   * await userService.update('uuid', { bio: 'New bio' });
   */
  async update(id: Uuid, updateUserDto: UpdateUserReqDto) {
    const user = await this.userRepository.findOneByOrFail({ id });

    user.bio = updateUserDto.bio;
    user.image = updateUserDto.image;
    user.updatedBy = SYSTEM_USER_ID;

    await this.userRepository.save(user);
  }

  /**
   * Soft deletes a user from the system.
   *
   * @param id - UUID of the user to remove
   * @throws {EntityNotFoundError} If the user is not found
   *
   * @example
   * await userService.remove('uuid');
   */
  async remove(id: Uuid) {
    await this.userRepository.findOneByOrFail({ id });
    await this.userRepository.softDelete(id);
  }
}
