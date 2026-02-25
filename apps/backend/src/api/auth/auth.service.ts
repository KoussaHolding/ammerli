import { IEmailJob } from '@/common/interfaces/job.interface';
import { Uuid } from '@/common/types/common.type';
import { Branded } from '@/common/types/types';
import { AllConfigType } from '@/config/config.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { CacheKey } from '@/constants/cache.constant';
import { ErrorMessageConstants } from '@/constants/error-code.constant';
import { QueueName } from '@/constants/job.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { createCacheKey } from '@/utils/cache.util';
import { verifyPassword } from '@/utils/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import crypto from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { ClientService } from '../client/client.service';
import { DriverService } from '../driver/driver.service';
import { SessionEntity } from '../user/entities/session.entity';
import { UserEntity } from '../user/entities/user.entity';
import { UserRoleEnum } from '../user/enums/user-role.enum';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { RefreshReqDto } from './dto/refresh.req.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { RegisterReqDto } from './dto/register.req.dto';
import { RegisterResDto } from './dto/register.res.dto';
import { JwtPayloadType } from './types/jwt-payload.type';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';

type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
  },
  'token'
>;

/**
 * Core service for handling authentication and session management.
 * Manages user registration, login, logout, token rotation (JWT), and session blacklisting.
 *
 * @class AuthService
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly clientService: ClientService,
    private readonly driverService: DriverService,
  ) {}

  /**
   * authenticates a user by phone and password.
   * Generates a new session and returns access/refresh tokens.
   *
   * @param dto - Login credentials
   * @returns Successful login payload including tokens and user info
   * @throws {UnauthorizedException} If credentials are invalid
   *
   * @example
   * const loginData = await authService.signIn({ phone: '+123', password: '...' });
   */
  async signIn(dto: LoginReqDto): Promise<LoginResDto> {
    const { phone, password } = dto;
    const user = await this.userRepository.findOne({
      where: { phone },
    });

    const isPasswordValid =
      user && (await verifyPassword(password, user.password));

    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessageConstants.AUTH.INVALID_CREDENTIALS);
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = new SessionEntity({
      hash,
      userId: user.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });
    await session.save();

    const token = await this.createToken({
      id: user.id,
      sessionId: session.id,
      hash,
    });

    return plainToInstance(LoginResDto, {
      userId: user.id,
      user,
      ...token,
    });
  }

  /**
   * Registers a new user and creates their specific profile (Client or Driver).
   * Validates role-specific requirements and ensures phone uniqueness.
   *
   * @param dto - Registration details (identity, role, password)
   * @param manager - Optional EntityManager for transactional consistency
   * @returns Detailed registration response
   * @throws {ValidationException} If phone exists or role data is invalid
   *
   * @example
   * await authService.register({ phone: '...', role: UserRoleEnum.CLIENT, ... });
   */
  async register(
    dto: RegisterReqDto,
    manager?: EntityManager,
  ): Promise<RegisterResDto> {
    const userRepo = manager
      ? manager.getRepository(UserEntity)
      : UserEntity.getRepository();

    if (dto.role === UserRoleEnum.CLIENT && dto.driverType) {
      throw new ValidationException(
        ErrorMessageConstants.AUTH.INVALID_ROLE_DATA,
      );
    }

    const isExistUser = await userRepo.exists({
      where: { phone: dto.phone },
    });

    if (isExistUser) {
      throw new ValidationException(ErrorMessageConstants.USER.PHONE_EXISTS);
    }

    const user = userRepo.create({
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: dto.password,
      role: dto.role,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });

    await user.save();

    if (dto.role === UserRoleEnum.CLIENT) {
      await this.clientService.createProfile(user);
    } else if (dto.role === UserRoleEnum.DRIVER) {
      await this.driverService.createProfile(user, dto.driverType!);
    }

    return plainToInstance(RegisterResDto, {
      userId: user.id,
      user,
    });
  }

  /**
   * Invalidates a user session by blacklisting the current token.
   * Session blacklisting persists in Cache (Redis) until token expiry.
   *
   * @param userToken - Decoded JWT payload from the current request
   *
   * @example
   * await authService.logout(decodedToken);
   */
  async logout(userToken: JwtPayloadType): Promise<void> {
    await this.cacheManager.set<boolean>(
      createCacheKey(CacheKey.SESSION_BLACKLIST, userToken.sessionId),
      true,
      userToken.exp * 1000 - Date.now(),
    );
    await SessionEntity.delete(userToken.sessionId);
  }

  /**
   * Rotates access and refresh tokens using a valid refresh token.
   * Validates session hash to prevent reuse of compromised refresh tokens.
   *
   * @param dto - Request containing valid refresh token
   * @returns New set of tokens
   * @throws {UnauthorizedException} If token is expired or session is invalid
   */
  async refreshToken(dto: RefreshReqDto): Promise<RefreshResDto> {
    const { sessionId, hash } = this.verifyRefreshToken(dto.refreshToken);
    const session = await SessionEntity.findOneBy({ id: sessionId });

    if (!session || session.hash !== hash) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findOneOrFail({
      where: { id: session.userId },
      select: ['id'],
    });

    const newHash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    SessionEntity.update(session.id, { hash: newHash });

    return await this.createToken({
      id: user.id,
      sessionId: session.id,
      hash: newHash,
    });
  }

  /**
   * Validates an access token and checks if the session has been blacklisted.
   *
   * @param token - Bearer access token string
   * @returns Decoded payload if valid
   * @throws {UnauthorizedException} If token is invalid or session is blacklisted
   */
  async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException();
    }

    const isSessionBlacklisted = await this.cacheManager.get<boolean>(
      createCacheKey(CacheKey.SESSION_BLACKLIST, payload.sessionId),
    );

    if (isSessionBlacklisted) {
      throw new UnauthorizedException();
    }

    return payload;
  }

  /**
   * Internal helper to verify refresh token integrity.
   * @private
   */
  private verifyRefreshToken(token: string): JwtRefreshPayloadType {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new UnauthorizedException();
    }
  }

  /**
   * Creates a dedicated token for email/account verification.
   * @private
   */
  private async createVerificationToken(data: { id: string }): Promise<string> {
    return await this.jwtService.signAsync(
      {
        id: data.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: Number(
          this.configService.getOrThrow<number>('auth.confirmEmailExpires', {
            infer: true,
          }),
        ),
      },
    );
  }

  /**
   * Generates a pair of access and refresh tokens for a user session.
   * Claims include user ID, Role, and Session ID for authorization.
   *
   * @param data - Session metadata needed for token signing
   * @returns Branded token payload
   * @private
   */
  private async createToken(data: {
    id: string;
    sessionId: string;
    hash: string;
  }): Promise<Token> {
    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role:
            (
              await this.userRepository.findOne({
                where: { id: data.id as Uuid },
              })
            )?.role || '',
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: this.configService.getOrThrow<number>('auth.expires', {
            infer: true,
          }),
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow<number>(
            'auth.refreshExpires',
            {
              infer: true,
            },
          ),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    } as Token;
  }
}
