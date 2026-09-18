import { config as loadEnv } from 'dotenv';

loadEnv();

const REQUIRED_ENV_VARS = [
  // app
  'ENVIRONMENT',
  'PORT',
  'SERVER_URL',
  'WEB_URL',
  // auth
  'PASSWORD_SECRET',
  'JWT_SECRET',
  'JWT_EXPIRE',
  // db
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
  // logs
  'LOG_LEVEL',
  'LOG_PRETTY_PRINT',
  // storage
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'AWS_S3_UPLOAD_URL_EXPIRES_IN',
  // stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PUBLISHABLE_KEY',
] as const;

const ALLOWED_ENVIRONMENTS = ['development', 'test', 'production'] as const;
const POSITIVE_INT_ENV_VARS = ['PORT', 'DATABASE_PORT', 'AWS_S3_UPLOAD_URL_EXPIRES_IN'] as const;
const BOOLEAN_ENV_VARS = ['LOG_PRETTY_PRINT'] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const errors: string[] = [];

  if (!ALLOWED_ENVIRONMENTS.includes(process.env.ENVIRONMENT as (typeof ALLOWED_ENVIRONMENTS)[number])) {
    errors.push(`ENVIRONMENT must be one of ${ALLOWED_ENVIRONMENTS.join(', ')}, got "${process.env.ENVIRONMENT}"`);
  }

  for (const key of POSITIVE_INT_ENV_VARS) {
    const value = Number(process.env[key]);
    if (!Number.isInteger(value) || value <= 0) {
      errors.push(`${key} must be a positive integer, got "${process.env[key]}"`);
    }
  }

  for (const key of BOOLEAN_ENV_VARS) {
    if (process.env[key] !== 'true' && process.env[key] !== 'false') {
      errors.push(`${key} must be "true" or "false", got "${process.env[key]}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment variables:\n${errors.join('\n')}`);
  }
}

export const config = {
  app: {
    environment: process.env.ENVIRONMENT!,
    port: Number(process.env.PORT),
    serverUrl: process.env.SERVER_URL!,
    webUrl: process.env.WEB_URL!,
  },
  auth: {
    passwordSecret: process.env.PASSWORD_SECRET!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpire: process.env.JWT_EXPIRE!,
  },
  db: {
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    name: process.env.DATABASE_NAME!,
  },
  logs: {
    level: process.env.LOG_LEVEL!,
    prettyPrint: process.env.LOG_PRETTY_PRINT === 'true',
  },
  storage: {
    awsRegion: process.env.AWS_REGION!,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    awsS3BucketName: process.env.AWS_S3_BUCKET_NAME!,
    awsS3UploadUrlExpiresIn: Number(process.env.AWS_S3_UPLOAD_URL_EXPIRES_IN),
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  },
};
