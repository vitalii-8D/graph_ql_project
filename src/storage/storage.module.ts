import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

import { StorageService } from './storage.service';
import { StorageResolver } from './storage.resolver';
import { S3_CLIENT } from './constants/common';
import { config } from '../constants/config';

const S3_REQUEST_TIMEOUT_MS = 10_000;
const S3_MAX_ATTEMPTS = 3;

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: () =>
        new S3Client({
          region: config.storage.awsRegion,
          credentials: {
            accessKeyId: config.storage.awsAccessKeyId,
            secretAccessKey: config.storage.awsSecretAccessKey,
          },
          maxAttempts: S3_MAX_ATTEMPTS,
          requestHandler: new NodeHttpHandler({
            requestTimeout: S3_REQUEST_TIMEOUT_MS,
            connectionTimeout: S3_REQUEST_TIMEOUT_MS,
          }),
        }),
    },
    StorageService,
    StorageResolver,
  ],
  exports: [StorageService],
})
export class StorageModule {}
