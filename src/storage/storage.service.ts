import { randomUUID } from 'node:crypto';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly expiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.region = this.require('AWS_REGION');
    this.bucket = this.require('AWS_S3_BUCKET_NAME');
    this.expiresIn = Number(this.configService.get<string>('AWS_S3_UPLOAD_URL_EXPIRES_IN') ?? 300);
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.require('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.require('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  private require(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`Missing required config: ${key}`);
    }

    return value;
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
