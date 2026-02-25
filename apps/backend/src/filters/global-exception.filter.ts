import { ErrorDetailDto } from '@/common/dto/error-detail.dto';
import { ErrorDto } from '@/common/dto/error.dto';
import { AllConfigType } from '@/config/config.type';
import { constraintErrors } from '@/constants/constraint-errors';
import { ErrorCode, ErrorMessageConstants } from '@/constants/error-code.constant';
import { ValidationException } from '@/exceptions/validation.exception';
import { I18nTranslations } from '@/generated/i18n.generated';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STATUS_CODES } from 'http';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private i18n: I18nContext<I18nTranslations>;
  private debug = false;
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    this.i18n = I18nContext.current(host);
    this.debug = this.configService.getOrThrow('app.debug', { infer: true });

    let error: ErrorDto;

    if (exception instanceof I18nValidationException) {
      error = this.handleI18nValidationException(exception);
    } else if (exception instanceof UnprocessableEntityException) {
      error = this.handleUnprocessableEntityException(exception);
    } else if (exception instanceof ValidationException) {
      error = this.handleValidationException(exception);
    } else if (exception instanceof HttpException) {
      error = this.handleHttpException(exception);
    } else if (exception instanceof QueryFailedError) {
      error = this.handleQueryFailedError(exception);
    } else if (exception instanceof EntityNotFoundError) {
      error = this.handleEntityNotFoundError(exception);
    } else {
      error = this.handleError(exception);
    }

    if (this.debug) {
      error.stack = exception.stack;
      error.trace = exception;

      this.logger.debug(error);
    }

    response.status(error.statusCode).json(error);
  }

  /**
   * Handles UnprocessableEntityException:
   * Check the request payload
   * Validate the input
   * @param exception UnprocessableEntityException
   * @returns ErrorDto
   */
  private handleUnprocessableEntityException(
    exception: UnprocessableEntityException,
  ): ErrorDto {
    const r = exception.getResponse() as { message: ValidationError[] };
    const statusCode = exception.getStatus();

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message:
        this.i18n?.t(ErrorMessageConstants.VALIDATION.COMMON as any) ||
        'Validation failed',
      details: this.extractValidationErrorDetails(r.message),
    };

    this.logger.debug(exception);

    return errorRes;
  }

  /**
   * Handles I18nValidationException from nestjs-i18n.
   * @param exception I18nValidationException
   * @returns ErrorDto
   */
  private handleI18nValidationException(
    exception: I18nValidationException,
  ): ErrorDto {
    const statusCode = exception.getStatus();
    const errors = exception.errors;

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message:
        this.i18n?.t(ErrorMessageConstants.VALIDATION.COMMON as any) ||
        'Validation failed',
      details: this.extractValidationErrorDetails(errors),
    };

    this.logger.debug(exception);

    return errorRes;
  }

  /**
   * Handles UnprocessableEntityException:
   * Extracts the domain-specific error code and optionally translates the message.
   *
   * @param exception - The ValidationException instance
   * @returns A structured ErrorDto for the response
   */
  private handleValidationException(exception: ValidationException): ErrorDto {
    const r = exception.getResponse() as {
      errorCode: ErrorCode;
      message: string;
    };
    const statusCode = exception.getStatus();

    const translatedMessage = this.i18n?.t(r.errorCode as any) as any;

    this.logger.debug(
      `Translating ${r.errorCode}: ${translatedMessage} (Lang: ${this.i18n?.lang})`,
    );

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      errorCode: r.errorCode,
      message:
        typeof translatedMessage === 'string' &&
        translatedMessage !== r.errorCode
          ? translatedMessage
          : r.message,
    };

    this.logger.debug(exception);

    return errorRes;
  }

  /**
   * Handles HttpException
   * @param exception HttpException
   * @returns ErrorDto
   */
  private handleHttpException(exception: HttpException): ErrorDto {
    const statusCode = exception.getStatus();
    const message = exception.message;

    // Try to translate the message if it's a key or matches a known pattern
    const translatedMessage = this.i18n?.t(message as any);

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message:
        typeof translatedMessage === 'string' && translatedMessage !== message
          ? translatedMessage
          : message,
    };

    this.logger.debug(exception);

    return errorRes;
  }

  /**
   * Handles QueryFailedError
   * @param error QueryFailedError
   * @returns ErrorDto
   */
  private handleQueryFailedError(error: QueryFailedError): ErrorDto {
    const r = error as QueryFailedError & { constraint?: string };
    const { status, message } = r.constraint?.startsWith('UQ')
      ? {
          status: HttpStatus.CONFLICT,
          message: r.constraint
            ? this.i18n.t(
                (constraintErrors[r.constraint] ||
                  r.constraint) as keyof I18nTranslations,
              )
            : undefined,
        }
      : {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: this.i18n.t('common.error.internal_server_error'),
        };
    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status],
      message,
    } as unknown as ErrorDto;

    this.logger.error(error);

    return errorRes;
  }

  /**
   * Handles EntityNotFoundError when using findOrFail() or findOneOrFail() from TypeORM
   * @param error EntityNotFoundError
   * @returns ErrorDto
   */
  private handleEntityNotFoundError(error: EntityNotFoundError): ErrorDto {
    const status = HttpStatus.NOT_FOUND;
    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status],
      message: this.i18n.t('common.error.entity_not_found'),
    } as unknown as ErrorDto;

    this.logger.debug(error);

    return errorRes;
  }

  /**
   * Handles generic errors
   * @param error Error
   * @returns ErrorDto
   */
  private handleError(error: Error): ErrorDto {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorRes = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode],
      message: error?.message || 'An unexpected error occurred',
    };

    this.logger.error(error);

    return errorRes;
  }

  /**
   * Extracts error details from ValidationError[]
   * @param errors ValidationError[]
   * @returns ErrorDetailDto[]
   */
  private extractValidationErrorDetails(
    errors: ValidationError[],
  ): ErrorDetailDto[] {
    const extractErrors = (
      error: ValidationError,
      parentProperty = '',
    ): ErrorDetailDto[] => {
      const propertyPath = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      const currentErrors: ErrorDetailDto[] = Object.entries(
        error.constraints || {},
      ).map(([code, message]) => {
        const translated = this.i18n?.t(`common.validation.${code}` as any);
        return {
          property: propertyPath,
          code,
          message:
            typeof translated === 'string' && translated !== `common.validation.${code}`
              ? translated
              : message,
        };
      });

      const childErrors: ErrorDetailDto[] =
        error.children?.flatMap((childError) =>
          extractErrors(childError, propertyPath),
        ) || [];

      return [...currentErrors, ...childErrors];
    };

    return errors.flatMap((error) => extractErrors(error));
  }
}
