import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from '../constants/config';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket = config.storage.awsS3BucketName;
  private readonly region = config.storage.awsRegion;
  private readonly expiresIn = config.storage.awsS3UploadUrlExpiresIn;

  constructor() {
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.storage.awsAccessKeyId,
        secretAccessKey: config.storage.awsSecretAccessKey,
      },
    });
  }

  buildObjectKey(prefix: string, originalFileName: string): string {
    const ext = originalFileName.includes('.') ? originalFileName.split('.').pop() : undefined;
    const safeExt = ext ? `.${ext.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';

    return `${prefix}/${randomUUID()}${safeExt}`;
  }

  buildPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });

    return getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
