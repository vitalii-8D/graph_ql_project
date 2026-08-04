import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { config } from '../constants/config';

export const createLogger = (context = 'Logger') => {
  const transportFormat = config.logs.prettyPrint
    ? winston.format.prettyPrint({ colorize: true })
    : winston.format.json();

  return winston.createLogger({
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp(),
      winston.format((info) => ({ ...info, context }))(),
    ),
    level: config.logs.level,
    transports: [
      new winston.transports.Console({
        format: transportFormat,
      }),
      new DailyRotateFile({
        filename: 'logs/%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH-mm',
        maxSize: '20m',
        maxFiles: '5',
        format: winston.format.json(),
      }),
    ],
  });
};
