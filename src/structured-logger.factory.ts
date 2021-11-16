import { Injectable } from '@nestjs/common';
import { StructuredLogger } from './structured.logger';

@Injectable()
export class StructuredLoggerFactory {
  createLogger(context: string): StructuredLogger {
    return new StructuredLogger(context);
  }
}
