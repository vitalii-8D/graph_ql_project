import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { config, validateEnv } from './constants/config';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.enableCors();

  await app.listen(config.app.port);

  console.log(`Server is running on ${config.app.port} port`);
}

void bootstrap();
