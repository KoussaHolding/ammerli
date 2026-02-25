import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingRuleEntity } from './entities/pricing-rule.entity';
import { ProductEntity } from '@/api/product/entities/product.entity';
import { PricingService } from './pricing.service';
import { BasePricingStrategy } from './strategies/base-pricing.strategy';
import { WilayaPricingStrategy } from './strategies/wilaya-pricing.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([PricingRuleEntity, ProductEntity]),
  ],
  providers: [
    PricingService,
    BasePricingStrategy,
    WilayaPricingStrategy,
  ],
  exports: [PricingService],
})
export class PricingModule {}
