import { WinstonLoggerService } from './winston-logger.service';
import { Client } from '@opensearch-project/opensearch';
import winston, { format } from 'winston';
import os from 'os';
import { structuredTransformer } from './structured.transformer';
import { ElasticsearchTransport, ElasticsearchTransportOptions } from 'winston-elasticsearch';
import { simple } from './simple.format';
import { Global, Module } from '@nestjs/common';
import { StructuredLoggerFactory } from './structured-logger.factory';
import { prefixesForLoggers, StructuredLogger } from './structured.logger';

export type ServiceInfo = {
  region?: string;
  environment?: string;
  organization?: string;
  product?: string;
  domain: string;
  name: string;
  version?: string;
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
    options.serviceInfo = {
      region: String(process.env.AWS_REGION || 'unknown'),
      environment: String(process.env.ENVIRONMENT || process.env.NODE_ENV),
      product: String(process.env.PRODUCT || ''),
      organization: String(process.env.ORGANIZATION || ''),
      version: String(process.env.BUILD_NUMBER || 'unknown'),

      ...options.serviceInfo,
    };

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
    let index = 'nodelogs.';
    if (options.serviceInfo.organization) {
      index += options.serviceInfo.organization + '.';
    }
    if (options.serviceInfo.product) {
      index += options.serviceInfo.product + '.';
    }
    index += options.serviceInfo.domain + '.' + options.serviceInfo.name;

    options = {
      client: new Client({
        node: process.env.ELASTIC_LOG || 'http://localhost:9200',
      }) as any,
      level: process.env.ELASTIC_LOG_LEVEL || 'debug',
      indexPrefix: index,
      transformer: structuredTransformer,
      bufferLimit: 1000,
      retryLimit: 0,

      ...options,
    };

    return new ElasticsearchTransport(options);
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
        service: `${options.domain}.${options.name}`,
        version: String(options.version),
        domain: String(options.domain),
        product: String(options.product),
        organization: String(options.organization),
        environment: String(options.environment),
        region: String(options.region),
        hostName: String(os.hostname()),
        pid: process.pid,
      },

      ...loggerOptions,
    };

    const logger = new WinstonLoggerService(loggerOptions);

    return logger;
  }

  static forRoot(): DynamicModule {
    const providers = [...prefixesForLoggers].map(prefix => {
      return {
        provide: `StructuredLogger$${prefix.name}`,
        useFactory: () => {
          return new StructuredLogger(prefix.name);
        }
      }
    });

    return {
      module: StructuredLoggingModule,
      providers: providers,
      exports: providers,
    };
  }
}
