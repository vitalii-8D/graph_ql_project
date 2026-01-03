import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { registerHbs } from './helpers/register-handlebars';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  registerHbs(app);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Server is running on ${port} port`);
}

bootstrap();
