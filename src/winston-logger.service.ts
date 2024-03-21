import { LoggerService } from '@nestjs/common';
import { createLogger, LoggerOptions, Logger as WinstonLogger } from 'winston';

export class WinstonLoggerService implements LoggerService {
  public inner: WinstonLogger;

  constructor(config: LoggerOptions) {
    this.inner = createLogger(config);
  }

  log(message: string, context?: string) {
    this.inner.info(this.formatMessage(message, context));
  }
  error(message: string, trace: string, context?: string) {
    this.inner.error({ ...this.formatMessage(message, context), trace });
  }
  warn(message: string, context?: string) {
    this.inner.warn(this.formatMessage(message, context));
  }
  debug(message: string, context?: string) {
    this.inner.debug(this.formatMessage(message, context));
  }
  verbose(message: string, context?: string) {
    this.inner.verbose(this.formatMessage(message, context));
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
