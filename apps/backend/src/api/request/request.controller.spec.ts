import { Uuid } from '@/common/types/common.type';
import { Test, TestingModule } from '@nestjs/testing';
import { UserResDto } from '../user/dto/user.res.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatusEnum } from './enums/request-status.enum';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('RequestController', () => {
  let controller: RequestController;
  let service: jest.Mocked<RequestService>;

  beforeEach(async () => {
    const serviceMock = {
      createRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [{ provide: RequestService, useValue: serviceMock }],
    }).compile();

    controller = module.get<RequestController>(RequestController);
    service = module.get(RequestService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service createRequest with correct arguments', async () => {
      const createRequestDto: CreateRequestDto = {
        pickupLocation: { lat: 10, lng: 20 },
        destinationLocation: { lat: 30, lng: 40 },
      } as any;
      const user: UserResDto = { id: 'user-1' as Uuid } as any;

      const expectedResult = {
        id: 'req-1' as Uuid,
        status: RequestStatusEnum.SEARCHING,
        user,
        ...createRequestDto,
      };

      service.createRequest.mockResolvedValue(expectedResult);

      const result = await controller.create(createRequestDto, user);

      expect(result).toBe(expectedResult);
      expect(service.createRequest).toHaveBeenCalledWith(
        createRequestDto,
        user,
      );
    });
  });
});
