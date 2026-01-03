import { INestApplication } from '@nestjs/common';
import morgan from 'morgan';

const morganJsonFormat = (tokens, req, res) => {
  const timestamp = new Date().toISOString();
  const method = tokens.method(req, res);
  const status = tokens.status(req, res);
  const responseTimeMs = tokens['response-time'](req, res);
  const operation = req.body?.operationName;
  //   const variables = req.body.variables;

  return `${timestamp}: ${method} ${operation} - ${status} ${responseTimeMs}`;
};

export const setUpMorgan = (app: INestApplication): void => {
  app.use(morgan(morganJsonFormat));
};
