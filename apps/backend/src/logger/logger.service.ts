import { Injectable } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';

/**
 * Custom Logger service implementing structured logging with Winston.
 * Provides sanitization for sensitive keys and supports multiple transport targets (Console, File).
 * Automatically injects environment metadata and formats logs for high readability.
 *
 * @class AppLogger
 */
@Injectable()
export class AppLogger {
  private logger: WinstonLogger;
  private context: string;

  constructor() {
    this.context = 'App';
    this.logger = createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format((info) => {
          info.environment = process.env.NODE_ENV || 'development';
          return info;
        })(),
        format.printf(
          ({
            timestamp,
            level,
            message,
            stack,
            requestId,
            ip,
            userAgent,
            ...meta
          }) => {
            const metaString = Object.keys(meta).length
              ? JSON.stringify(meta)
              : '';

            return `[${timestamp}] [${level.toUpperCase()}] requestId=${requestId || '-'} ip=${ip || '-'} ua=${userAgent || '-'} ${message} ${stack || ''} ${metaString}`;
          },
        ),
      ),
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
        new transports.File({ filename: 'logs/combined.log' }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
      ],
    });
  }

  /**
   * Updates the internal context name for subsequent log entries.
   * Typically set to the class name during service initialization.
   *
   * @param context - The context name (e.g., 'UserService')
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Logs a message with structured metadata at the INFO level.
   * Automatic sanitization is applied to the metadata.
   *
   * @param message - Descriptive log message
   * @param meta - Key-value pairs of associated data
   */
  infoStructured(message: string, meta?: Record<string, any>) {
    this.logger?.info(message, {
      ...this.sanitizeMeta(meta),
    });
  }

  /**
   * Logs an error message with structured metadata at the ERROR level.
   * Automatic sanitization is applied to the metadata.
   *
   * @param message - Descriptive error message
   * @param meta - Key-value pairs of associated data (e.g., entity IDs)
   */
  errorStructured(message: string, meta?: Record<string, any>) {
    this.logger?.error(message, {
      ...this.sanitizeMeta(meta),
    });
  }

  /**
   * Logs a warning message with structured metadata.
   *
   * @param message - Warning message
   * @param meta - Associated metadata
   */
  warnStructured(message: string, meta?: Record<string, any>) {
    this.logger?.warn(message, this.sanitizeMeta(meta));
  }

  /**
   * Logs a debug message with structured metadata.
   *
   * @param message - Debug message
   * @param meta - Detailed technical metadata
   */
  debugStructured(message: string, meta?: Record<string, any>) {
    this.logger?.debug(message, this.sanitizeMeta(meta));
  }

  /**
   * Standard NestJS Logger interface implementation for INFO level.
   */
  log(message: string) {
    this.logger?.info(message);
  }

  /**
   * Standard NestJS Logger interface implementation for ERROR level.
   * Includes optional stack trace support.
   */
  error(message: string, trace?: string) {
    if (this.logger) {
      this.logger.error(message, { stack: trace });
    } else {
      console.error(`[AppLogger FALLBACK] ${message}`, trace);
    }
  }

  /**
   * Standard NestJS Logger interface implementation for WARN level.
   */
  warn(message: string) {
    this.logger?.warn(message);
  }

  /**
   * Standard NestJS Logger interface implementation for DEBUG level.
   */
  debug(message: string) {
    this.logger?.debug(message);
  }

  /**
   * Internally cleans metadata by removing sensitive keys like 'password' or 'token'.
   *
   * @param meta - Original metadata object
   * @returns A shallow copy of the metadata without sensitive fields
   * @private
   */
  private sanitizeMeta(meta?: Record<string, any>) {
    if (!meta) return {};
    const sensitiveKeys = ['password', 'token', 'authorization', 'secret'];
    const sanitized = { ...meta };
    sensitiveKeys.forEach((key) => delete sanitized[key]);
    return sanitized;
  }
}
