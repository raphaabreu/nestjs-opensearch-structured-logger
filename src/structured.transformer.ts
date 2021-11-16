import { LogData } from 'winston-elasticsearch';

export function structuredTransformer(logData: LogData) {
  if (logData.message.error) {
    logData.meta.error = logData.message.error;
    delete logData.message.error;
  }
  if (logData.message.context) {
    logData.meta.context = logData.message.context;
    delete logData.message.context;
  }
  if (logData.message.message) {
    const { message, ...extra } = logData.message;
    logData.message = message;
    logData.meta = { ...logData.meta, ...extra };
  }

  if (logData.meta && logData.meta.context && typeof logData.meta.context == 'object') {
    logData.meta = {
      ...logData.meta,
      ...logData.meta.context,
    };
    delete logData.meta.context;
  }

  const transformed: any = {
    ['@timestamp']: logData.timestamp ? logData.timestamp : new Date().toISOString(),

    message: logData.message,
    level: logData.level,
    messageId: Math.floor(Math.random() * 89999999999) + 10000000000,
    ...logData.meta,
  };

  return transformed;
}
