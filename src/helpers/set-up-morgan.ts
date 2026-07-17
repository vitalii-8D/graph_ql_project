import type { INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import morgan from 'morgan';

const morganJsonFormat: morgan.FormatFn<Request, Response> = (tokens, req, res) => {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTimeMs: tokens['response-time'](req, res),
      userAgent: tokens['user-agent'](req, res),
    },
    null,
    2,
  );
};

export const setUpMorgan = (app: INestApplication): void => {
  app.use(
    morgan(morganJsonFormat, {
      skip(req: Request): boolean {
        return (
          req.method === 'OPTIONS' ||
          req.url === '/health' ||
          req.url.startsWith('/api/v1/docs') ||
          !req.url.startsWith('/api/v1')
        );
      },
    }),
  );
};
