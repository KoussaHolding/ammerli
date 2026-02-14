import { Inject, Injectable, Scope, Optional } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';

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
           format: format.combine(format.colorize(), format.simple())
        }),
        new transports.File({ filename: 'logs/combined.log' }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  infoStructured(message: string, meta?: Record<string, any>) {
    this.logger?.info(message, {
      ...this.sanitizeMeta(meta),
    });
  }

  errorStructured(message: string, meta?: Record<string, any>) {
    this.logger?.error(message, {
      ...this.sanitizeMeta(meta),
    });
  }

  warnStructured(message: string, meta?: Record<string, any>) {
    this.logger?.warn(message, this.sanitizeMeta(meta));
  }

  debugStructured(message: string, meta?: Record<string, any>) {
    this.logger?.debug(message, this.sanitizeMeta(meta));
  }

  private sanitizeMeta(meta?: Record<string, any>) {
    if (!meta) return {};
    const sensitiveKeys = ['password', 'token', 'authorization', 'secret'];
    const sanitized = { ...meta };
    sensitiveKeys.forEach((key) => delete sanitized[key]);
    return sanitized;
  }

  log(message: string) {
    this.logger?.info(message);
  }
  error(message: string, trace?: string) {
    if (this.logger) {
        this.logger.error(message, { stack: trace });
    } else {
        console.error(`[AppLogger FALLBACK] ${message}`, trace);
    }
  }
  warn(message: string) {
    this.logger?.warn(message);
  }
  debug(message: string) {
    this.logger?.debug(message);
  }
}
