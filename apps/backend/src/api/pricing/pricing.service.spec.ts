import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { BasePricingStrategy } from './strategies/base-pricing.strategy';
import { WilayaPricingStrategy } from './strategies/wilaya-pricing.strategy';
import { PricingContext } from './interfaces/pricing-context.interface';
import { Uuid } from '@/common/types/common.type';

describe('PricingService', () => {
  let service: PricingService;
  let baseStrategy: BasePricingStrategy;
  let wilayaStrategy: WilayaPricingStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: BasePricingStrategy,
          useValue: {
            name: 'BasePricing',
            priority: 100,
            calculate: jest.fn(),
          },
        },
        {
          provide: WilayaPricingStrategy,
          useValue: {
            name: 'WilayaPricing',
            priority: 10,
            calculate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    baseStrategy = module.get<BasePricingStrategy>(BasePricingStrategy);
    wilayaStrategy = module.get<WilayaPricingStrategy>(WilayaPricingStrategy);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return price from WilayaPricingStrategy if it returns a value', async () => {
    const context: PricingContext = { productId: 'p1' as Uuid, wilayaId: 'w1' as Uuid };
    const expectedPrice = 150;

    jest.spyOn(wilayaStrategy, 'calculate').mockResolvedValue(expectedPrice);
    
    const result = await service.calculatePrice(context);

    expect(result).toBe(expectedPrice);
    expect(wilayaStrategy.calculate).toHaveBeenCalledWith(context);
    // Base strategy should NOT be called if higher priority strategy returns a value
    expect(baseStrategy.calculate).not.toHaveBeenCalled();
  });

  it('should fallback to BasePricingStrategy if WilayaPricingStrategy returns null', async () => {
    const context: PricingContext = { productId: 'p1' as Uuid, wilayaId: 'w1' as Uuid };
    const expectedPrice = 100;

    jest.spyOn(wilayaStrategy, 'calculate').mockResolvedValue(null);
    jest.spyOn(baseStrategy, 'calculate').mockResolvedValue(expectedPrice);

    const result = await service.calculatePrice(context);

    expect(result).toBe(expectedPrice);
    expect(wilayaStrategy.calculate).toHaveBeenCalledWith(context);
    expect(baseStrategy.calculate).toHaveBeenCalledWith(context);
  });

  it('should throw error if no strategy returns a value', async () => {
    const context: PricingContext = { productId: 'p1' as Uuid };

    jest.spyOn(wilayaStrategy, 'calculate').mockResolvedValue(null);
    jest.spyOn(baseStrategy, 'calculate').mockResolvedValue(null);

    await expect(service.calculatePrice(context)).rejects.toThrow('Could not calculate price for the given context');
  });
});
