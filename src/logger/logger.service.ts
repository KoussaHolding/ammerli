import { Injectable, Scope } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private logger: WinstonLogger;
  private context: string;

  constructor() {
    this.context = 'App';
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] [${this.context}] [${level.toUpperCase()}] ${message} ${stack || ''}`;
        }),
      ),
      transports: [
        new transports.File({ filename: 'logs/combined.log' }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, { stack: trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
