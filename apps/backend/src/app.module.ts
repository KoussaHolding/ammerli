import { Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import generateModulesSet from './utils/modules-set';

@Module({
  imports: [...generateModulesSet(), LoggerModule],
})
export class AppModule {}
