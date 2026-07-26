import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Server is running on ${port} port`);
}

void bootstrap();
