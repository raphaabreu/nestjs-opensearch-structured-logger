import { LoggerService } from '@nestjs/common';
import { createLogger, LoggerOptions, Logger as WinstonLogger } from 'winston';

export class WinstonLoggerService implements LoggerService {
  private logger: WinstonLogger;

  constructor(config: LoggerOptions) {
    this.logger = createLogger(config);
  }

  log(message: string, context?: string) {
    this.logger.info(this.formatMessage(message, context));
  }
  error(message: string, trace: string, context?: string) {
    this.logger.error({ ...this.formatMessage(message, context), trace });
  }
  warn(message: string, context?: string) {
    this.logger.warn(this.formatMessage(message, context));
  }
  debug(message: string, context?: string) {
    this.logger.debug(this.formatMessage(message, context));
  }
  verbose(message: string, context?: string) {
    this.logger.verbose(this.formatMessage(message, context));
  }

  private formatMessage(message: string | any, context?: string) {
    if (typeof message === 'string' || message instanceof String) {
      return { message, context };
    }

    if (context) {
      return { ...message, context };
    }

    return { message };
  }
}
