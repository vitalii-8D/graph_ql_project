import { parseArgs } from 'node:util';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../app.module';
import { SeederService } from './seeder.service';

const DEFAULT_USERS_COUNT = 4;
const DEFAULT_POSTS_COUNT = 10;

function parseSeedOptions(): { usersCount: number; postsCount: number } {
  const { values } = parseArgs({
    options: {
      users: { type: 'string', short: 'u' },
      posts: { type: 'string', short: 'p' },
    },
    strict: true,
  });

  const usersCount = values.users !== undefined ? Number(values.users) : DEFAULT_USERS_COUNT;
  const postsCount = values.posts !== undefined ? Number(values.posts) : DEFAULT_POSTS_COUNT;

  if (!Number.isInteger(usersCount) || usersCount < 1) {
    throw new Error('--users (-u) must be an integer >= 1');
  }

  if (!Number.isInteger(postsCount) || postsCount < 0) {
    throw new Error('--posts (-p) must be an integer >= 0');
  }

  return { usersCount, postsCount };
}

async function bootstrap() {
  const { usersCount, postsCount } = parseSeedOptions();

  const app = await NestFactory.createApplicationContext(AppModule);

  const seeder = app.get(SeederService);

  try {
    await seeder.seed(usersCount, postsCount);
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
