import { parseArgs } from 'node:util';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { ReindexService, type ReindexTarget } from './reindex.service';

const ALL_TARGETS: ReindexTarget[] = ['users', 'posts', 'comments'];

function parseReindexOptions(): { targets: ReindexTarget[]; recreate: boolean } {
  const { values } = parseArgs({
    options: {
      index: { type: 'string', short: 'i' },
      recreate: { type: 'boolean', short: 'r', default: false },
    },
    strict: true,
  });

  const requested = values.index ?? 'all';
  if (requested !== 'all' && !ALL_TARGETS.includes(requested as ReindexTarget)) {
    throw new Error(`--index (-i) must be one of: all, ${ALL_TARGETS.join(', ')}`);
  }

  const targets = requested === 'all' ? ALL_TARGETS : [requested as ReindexTarget];

  return { targets, recreate: Boolean(values.recreate) };
}

async function bootstrap() {
  const { targets, recreate } = parseReindexOptions();

  const app = await NestFactory.createApplicationContext(AppModule);
  const reindexService = app.get(ReindexService);

  try {
    await reindexService.run(targets, { recreate });
    console.log('\nReindex complete!');
  } catch (error) {
    console.error('Reindex failed!');
    console.error(error);
    throw error;
  } finally {
    await app.close();
  }
}

void bootstrap();
