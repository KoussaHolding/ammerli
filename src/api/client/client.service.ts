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
import { plainToInstance } from 'class-transformer';
import { ClientResDto } from './dto/client.res.dto';
import { ListClientReqDto } from './dto/list-client.req.dto';
import { LoadMoreClientsReqDto } from './dto/load-more-clients.req.dto';
import { UpdateClientReqDto } from './dto/update-client.req.dto';
import { ClientEntity } from './entities/client.entity';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly ClientRepository: Repository<ClientEntity>,
  ) {}



  async createProfile(user: UserEntity): Promise<ClientEntity> {
    const client = this.ClientRepository.create({
      user,
    });
    return await this.ClientRepository.save(client);
  }

  async findAll(
    reqDto: ListClientReqDto,
  ): Promise<OffsetPaginatedDto<ClientResDto>> {
    const query = this.ClientRepository.createQueryBuilder('Client')
      .leftJoinAndSelect('Client.user', 'user')
      .orderBy('Client.createdAt', 'DESC');

    const [Clients, metaDto] = await paginate<ClientEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });

    return new OffsetPaginatedDto(
      plainToInstance(ClientResDto, Clients),
      metaDto,
    );
  }

  async loadMoreClients(
    reqDto: LoadMoreClientsReqDto,
  ): Promise<CursorPaginatedDto<ClientResDto>> {
    const queryBuilder = this.ClientRepository.createQueryBuilder('Client');
    const paginator = buildPaginator({
      entity: ClientEntity,
      alias: 'Client',
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

    return new CursorPaginatedDto(plainToInstance(ClientResDto, data), metaDto);
  }

  async findOne(id: Uuid): Promise<ClientResDto> {
    const Client = await this.ClientRepository.findOneOrFail({ where: { id } });
    return Client.toDto(ClientResDto);
  }

  async update(id: Uuid, updateDto: UpdateClientReqDto) {
    const Client = await this.ClientRepository.findOneOrFail({ where: { id } });

    Object.assign(Client, updateDto);
    Client.updatedBy = SYSTEM_USER_ID;

    await this.ClientRepository.save(Client);
  }

  async remove(id: Uuid) {
    await this.ClientRepository.findOneOrFail({ where: { id } });
    await this.ClientRepository.softDelete(id);
  }
}
