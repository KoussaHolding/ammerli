import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WilayaEntity } from './entities/wilaya.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WilayaEntity])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class WilayaModule {}
