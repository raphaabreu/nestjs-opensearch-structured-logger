import { format } from 'winston';

export const simple = format.printf((info) => {
  const { level, timestamp } = info;
  let { context, message } = info;

  if (message && (message as any).context) {
    context = (message as any).context;
  }
  if (message && (message as any).message) {
    message = (message as any).message as string;
  }
  if (typeof context === 'object') {
    context = undefined;
  }

  return `${timestamp} ${level}: [${context ?? '-'}] ${message}`;
});
