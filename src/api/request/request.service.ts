import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { KafkaProducerService } from '@sawayo/kafka-nestjs';
import { UserResDto } from '../user/dto/user.res.dto';
import { UserService } from '../user/user.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResDto } from './dto/request.res.dto';

@Injectable()
export class RequestService {
  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    private readonly userService: UserService,
  ) {}

  async createRequest(
    dto: CreateRequestDto,
    user: UserResDto,
  ): Promise<RequestResDto> {
    const requestId = uuidv4();

    const requestPayload = {
      id: requestId,
      ...dto,
      status: 'SEARCHING',
      createdAt: new Date(),
      user,
    };

    this.kafkaProducer.send({
      topic: 'request.created',
      messages: [
        {
          value: JSON.stringify(requestPayload),
        },
      ],
    });

    return {
      ...requestPayload,
      user,
    };
  }
}
