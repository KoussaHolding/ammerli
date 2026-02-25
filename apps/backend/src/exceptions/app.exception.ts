import { ErrorCode } from '@/constants/error-code.constant';
import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly debugMessage?: string, // Optional info for logs (not sent to user)
  ) {
    super(
      {
        code: errorCode,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
