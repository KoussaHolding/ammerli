import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ClientEntity } from './entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity]), AuthModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [],
})
export class ClientModule {}
