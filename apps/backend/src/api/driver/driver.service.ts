import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { buildPaginator } from '@/utils/cursor-pagination';
import { paginate } from '@/utils/offset-pagination';
import { applyFiltersToQueryBuilder } from '@/utils/query-filter.util';

import { plainToInstance } from 'class-transformer';
import { UserEntity } from '../user/entities/user.entity';
import { DriverResDto } from './dto/driver.res.dto';
import { ListDriverReqDto } from './dto/list-driver.req.dto';
import { LoadMoreDriversReqDto } from './dto/load-more-drivers.req.dto';
import { UpdateDriverReqDto } from './dto/update-driver.req.dto';
import { DriverEntity } from './entities/driver.entity';
import { DriverTypeEnum } from './enums/driver-type.enum';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
  ) {}

  async createProfile(
    user: UserEntity,
    type: DriverTypeEnum,
  ): Promise<DriverEntity> {
    const driver = this.driverRepository.create({
      user,
      type,
    });
    return await this.driverRepository.save(driver);
  }

  async findAll(
    reqDto: ListDriverReqDto,
  ): Promise<OffsetPaginatedDto<DriverResDto>> {
    const query = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .orderBy('driver.createdAt', 'DESC');

    applyFiltersToQueryBuilder(query, reqDto, {
      searchColumns: ['user.firstName', 'user.lastName', 'user.email', 'user.phone'],
    });


    const [drivers, metaDto] = await paginate<DriverEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(
      plainToInstance(DriverResDto, drivers),
      metaDto,
    );
  }

  async loadMoreDrivers(
    reqDto: LoadMoreDriversReqDto,
  ): Promise<CursorPaginatedDto<DriverResDto>> {
    const queryBuilder = this.driverRepository.createQueryBuilder('driver');
    const paginator = buildPaginator({
      entity: DriverEntity,
      alias: 'driver',
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

    return new CursorPaginatedDto(plainToInstance(DriverResDto, data), metaDto);
  }

  async findOne(id: Uuid): Promise<DriverResDto> {
    const driver = await this.driverRepository.findOneOrFail({ where: { id } });
    return driver.toDto(DriverResDto);
  }

  async update(id: Uuid, updateDto: UpdateDriverReqDto) {
    const driver = await this.driverRepository.findOneOrFail({ where: { id } });

    Object.assign(driver, updateDto);
    driver.updatedBy = SYSTEM_USER_ID;

    await this.driverRepository.save(driver);
  }

  async remove(id: Uuid) {
    await this.driverRepository.findOneOrFail({ where: { id } });
    await this.driverRepository.softDelete(id);
  }
}
