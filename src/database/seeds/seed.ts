import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../app.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seeder = app.get(SeederService);

  try {
    await seeder.seed();
    console.log('\nSeeding complete!');
  } catch (error) {
    console.error('Seeding failed!');
    console.error(error);
    throw error;
  } finally {
    await app.close();
  }
}

void bootstrap();
