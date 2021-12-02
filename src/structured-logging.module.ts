import { WinstonLoggerService } from './winston-logger.service';
import { Client } from '@opensearch-project/opensearch';
import winston, { format } from 'winston';
import os from 'os';
import { structuredTransformer } from './structured.transformer';
import { ElasticsearchTransport, ElasticsearchTransportOptions } from 'winston-elasticsearch';
import { simple } from './simple.format';
import { Global, Module } from '@nestjs/common';
import { StructuredLoggerFactory } from './structured-logger.factory';

export type ServiceInfo = {
  name: string;
  version: string;
  debugMode?: boolean;
};

export type StructuredLoggingOptions = {
  serviceInfo: ServiceInfo;
} & ElasticsearchTransportOptions;

@Global()
@Module({
  providers: [StructuredLoggerFactory],
  exports: [StructuredLoggerFactory],
})
export class StructuredLoggingModule {
  static bootstrap(options: StructuredLoggingOptions, loggerOptions?: winston.LoggerOptions): WinstonLoggerService {
    const esTransport = StructuredLoggingModule.createElasticTransport(options);

    const winstonLoggerService = this.createLogger(options.serviceInfo, {
      transports: [
        new winston.transports.Console({
          format: StructuredLoggingModule.formatForConsole(options.serviceInfo.debugMode),
          level: process.env.CONSOLE_LOG_LEVEL || 'info',
        }),
        esTransport,
      ],
      ...loggerOptions,
    });

    return winstonLoggerService;
  }

  static createElasticTransport(options: StructuredLoggingOptions): ElasticsearchTransport {
    options = {
      client: new Client({
        node: process.env.ELASTIC_LOG || 'http://localhost:9200',
      }) as any,
      level: process.env.ELASTIC_LOG_LEVEL || 'debug',
      indexPrefix: 'logs.' + options.serviceInfo.name,
      transformer: structuredTransformer,
      bufferLimit: 1000,
      retryLimit: 0,

      ...options,
    };

    const transport = new ElasticsearchTransport(options);

    transport.on('error', (error) => {
      // tslint:disable-next-line:no-console
      console.error('Error in Elastic Search transport', error);
    });

    return transport;
  }

  static formatForConsole(colorize = true): winston.Logform.Format {
    const formats = [format.timestamp({ format: 'isoDateTime' })];
    if (colorize) {
      formats.push(format.colorize({ level: true }));
    }
    formats.push(simple);

    return winston.format.combine(...formats);
  }

  static createLogger(options: ServiceInfo, loggerOptions?: winston.LoggerOptions): WinstonLoggerService {
    loggerOptions = {
      defaultMeta: {
        service: {
          name: String(options.name),
          version: String(options.version),
          environment: String(process.env.NODE_ENV),
          region: String(process.env.AWS_REGION),
          hostName: String(os.hostname()),
          pid: process.pid,
        },
      },

      ...loggerOptions,
    };

    return new WinstonLoggerService(loggerOptions);
  }
}
