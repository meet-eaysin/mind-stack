import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { loadConfig } from '@repo/config';
import { createLogger } from '@repo/logger';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger('API');

  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  app.enableCors({
    origin: config.WEB_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api/v1');

  await app.listen(config.API_PORT, '0.0.0.0');
  logger.info(`API server running on http://0.0.0.0:${config.API_PORT}`);
}

void bootstrap();
