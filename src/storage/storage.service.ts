import { randomUUID } from 'node:crypto';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from '../constants/config';
import { S3_CLIENT } from './constants/common';

@Injectable()
export class StorageService {
  private readonly bucket = config.storage.awsS3BucketName;
  private readonly region = config.storage.awsRegion;
  private readonly expiresIn = config.storage.awsS3UploadUrlExpiresIn;

  constructor(@Inject(S3_CLIENT) private readonly client: S3Client) {}

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

  /**
   * Verifies an object a client claims to have uploaded actually exists and matches the
   * declared size/content-type, instead of trusting client-reported metadata outright.
   */
  async verifyUploadedObject(key: string, expectedContentType: string, maxSizeBytes: number): Promise<void> {
    let head: HeadObjectCommandOutput;
    try {
      head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      if (err instanceof NotFound) {
        throw new BadRequestException(`No uploaded object found for key "${key}"`);
      }
      throw err;
    }

    if (typeof head.ContentLength === 'number' && head.ContentLength > maxSizeBytes) {
      throw new BadRequestException(`Uploaded object exceeds the maximum allowed size of ${maxSizeBytes} bytes`);
    }
    if (head.ContentType && !head.ContentType.startsWith(expectedContentType.split(';')[0])) {
      throw new BadRequestException(
        `Uploaded object's content type (${head.ContentType}) does not match the declared type (${expectedContentType})`,
      );
    }
  }
}
