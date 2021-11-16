import { Logger } from '@nestjs/common';

// eslint-disable-next-line no-useless-escape
const PLACEHOLDER_REGEX = /\$\{([^\}\$\{]+)\}/g;

export class StructuredLogger extends Logger {
  private scope: any;

  constructor(context: string) {
    super(context);
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
    super.log(this.formatMessage(message, values));
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
    super.error(formattedMessage);
  }

  warn(message: any, ...values: any[]) {
    super.warn(this.formatMessage(message, values));
  }

  debug(message: any, ...values: any[]) {
    super.debug(this.formatMessage(message, values));
  }

  verbose(message: any, ...values: any[]) {
    super.verbose(this.formatMessage(message, values));
  }

  private formatMessage(message: any, values: any[]): any {
    let message_str = String(message);
    let data: any = {
      message: message_str,
      context: this.context,
    };

    const placeholders = [...((message_str as any).matchAll(PLACEHOLDER_REGEX) as string[])];

    if (placeholders.length > 0) {
      data = {
        ...data,
        fields: {},
        messageTemplate: message_str,
      };

      for (let index = 0; index < placeholders.length; index++) {
        const placeholder = placeholders[index];
        const placeholderMatch = placeholder[0];
        const placeholderName = placeholder[1];

        if (index > values.length) {
          throw new Error(`You must provide one value for each placeholder used for message template "${message_str}"`);
        }

        const value = values[index];

        data = {
          ...data,
          fields: {
            [placeholderName]: value,
            ...data.fields,
          },
        };

        const value_str = String(value);

        message_str = message_str.replace(
          placeholderMatch,
          value_str.substring(0, 100) + (value_str.length > 100 ? '...' : ''),
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

    return { ...data, message: message_str };
  }
}
