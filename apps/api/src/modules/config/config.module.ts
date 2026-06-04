import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),

        // Database
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().optional(),

        // JWT
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional().allow(''),
        REDIS_DB: Joi.number().default(0),

        // CORS
        ALLOWED_ORIGINS: Joi.string().optional(),
        CORS_ALLOW_ALL: Joi.boolean().default(false),

        // Stripe
        STRIPE_SECRET_KEY: Joi.string().optional(),
        STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
        STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

        // AI
        OPENAI_API_KEY: Joi.string().optional(),
        ANTHROPIC_API_KEY: Joi.string().optional(),

        // Email
        SMTP_HOST: Joi.string().default('smtp.gmail.com'),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASS: Joi.string().optional(),
        EMAIL_FROM: Joi.string().default('noreply@eduai.app'),

        // Twilio
        TWILIO_ACCOUNT_SID: Joi.string().optional(),
        TWILIO_AUTH_TOKEN: Joi.string().optional(),
        TWILIO_PHONE_NUMBER: Joi.string().optional(),

        // AWS S3
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
        AWS_REGION: Joi.string().default('us-east-1'),
        AWS_S3_BUCKET: Joi.string().default('eduai-uploads'),

        // Elasticsearch
        ELASTICSEARCH_NODE: Joi.string().default('http://localhost:9200'),
        ELASTICSEARCH_USERNAME: Joi.string().optional(),
        ELASTICSEARCH_PASSWORD: Joi.string().optional(),

        // FCM
        FCM_SERVER_KEY: Joi.string().optional(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
  ],
})
export class ConfigAppModule {}
