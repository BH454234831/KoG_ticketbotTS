import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { config } from './config.js';
import { inspect } from 'util';

const { combine, timestamp, json, prettyPrint } = winston.format;

const serialize = (error: Error, options: { showHidden?: boolean; depth?: number } = {}, i = 1): string => {
  return `${i}. ${error.stack}\n${error.cause instanceof Error ? serialize(error.cause, options, i + 1) : inspect(error, options.showHidden, options.depth)}`;
};

const formatError = winston.format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: serialize(info, { showHidden: false, depth: 3 }).split('\n'),
    };
  }

  return info;
});

export const consoleWinstonTransport = new winston.transports.Console({
  format: combine(timestamp({ format: 'isoDateTime' }), formatError(), json({ deterministic: true }), prettyPrint({ colorize: true })),
});

export const logDir = path.join(process.cwd(), 'logs');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function makeLogger (prefix: string) {
  const fileWinstonTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, `${prefix}%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
  });

  const fileErrorWinstonTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, `${prefix}%DATE%-error.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    level: 'error',
  });

  const logger = winston.createLogger({
    level: config.LOGGER_LEVEL,
    format: combine(timestamp({ format: 'isoDateTime' }), formatError(), json({ deterministic: true, space: 2 })),
    transports: [consoleWinstonTransport, fileWinstonTransport, fileErrorWinstonTransport],
  });

  logger.setMaxListeners(50);

  return {
    fileWinstonTransport,
    fileErrorWinstonTransport,
    logger,
  };
}

export const { fileWinstonTransport, fileErrorWinstonTransport, logger } = makeLogger('');
