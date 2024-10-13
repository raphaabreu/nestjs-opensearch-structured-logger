import { Inject, Logger } from '@nestjs/common';

// eslint-disable-next-line no-useless-escape
const PLACEHOLDER_REGEX = /\$\{([^\}\$\{]+)\}/g;

export class StructuredLogger {
  private scope: any;
  private context: string;
  private logger: Logger;

  constructor(context: string) {
    this.setContext(context);
  }

  setContext(context: string) {
    this.context = context;
    this.logger = new Logger(context);
  }

  createScope(scope: { [key: string]: string | number | boolean }) {
    const scopped = new StructuredLogger(this.context);

    scopped.scope = {
      ...(this.scope || {}),
      ...scope,
    };

    return scopped;
  }

  appendScope(scope: { [key: string]: string | number | boolean }) {
    this.scope = {
      ...(this.scope || {}),
      ...scope,
    };
  }

  log(message: any, ...values: any[]) {
    this.logger.log(this.formatMessage(message, values));
  }

  error(message: any, error: string | Error, ...values: any[]) {
    const formattedMessage: any = this.formatMessage(message, values);
    if (error) {
      if ((error as Error).name || (error as Error).message || (error as Error).stack) {
        formattedMessage.error = {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack,
        };
      } else {
        formattedMessage.error = error;
      }
    }
    this.logger.error(formattedMessage);
  }

  warn(message: any, ...values: any[]) {
    this.logger.warn(this.formatMessage(message, values));
  }

  debug(message: any, ...values: any[]) {
    this.logger.debug(this.formatMessage(message, values));
  }

  verbose(message: any, ...values: any[]) {
    this.logger.verbose(this.formatMessage(message, values));
  }

  private formatMessage(message: any, values: any[]): any {
    let messageStr = String(message);
    let data: any = {
      message: messageStr,
      context: this.context,
    };

    const placeholders = [...((messageStr as any).matchAll(PLACEHOLDER_REGEX) as string[])];

    if (placeholders.length > 0) {
      data = {
        ...data,
        fields: {},
        messageTemplate: messageStr,
      };

      for (let index = 0; index < placeholders.length; index++) {
        const placeholder = placeholders[index];
        const placeholderMatch = placeholder[0];
        const placeholderName = placeholder[1];

        if (index > values.length) {
          throw new Error(`You must provide one value for each placeholder used for message template "${messageStr}"`);
        }

        const value = values[index];

        data = {
          ...data,
          fields: {
            [placeholderName]: value,
            ...data.fields,
          },
        };

        const valueStr = String(value);

        messageStr = messageStr.replace(
          placeholderMatch,
          valueStr.substring(0, 100) + (valueStr.length > 100 ? '...' : ''),
        );
      }
    }

    if (this.scope) {
      data = {
        ...data,
        fields: {
          ...(data.fields || {}),
          ...this.scope,
        },
      };
    }

    return { ...data, message: messageStr };
  }
}

export const prefixesForLoggers = new Set<Function>();

export const InjectLogger = (): ReturnType<typeof Inject> => {
  return (target: Function, key: string | symbol, index?: number) => {
    prefixesForLoggers.add(target);
    return Inject(`StructuredLogger$${target.name}`)(target, key, index);
  };
};
