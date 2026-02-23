import { NestFactory } from '@nestjs/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { createLogger } from '@repo/logger';
import { ConfigService } from '@nestjs/config';

async function setupSwagger(
  app: INestApplication,
  logger: ReturnType<typeof createLogger>,
): Promise<void> {
  const packageName = '@nestjs/swagger';

  try {
    const swagger = await import(packageName);
    if (!('DocumentBuilder' in swagger) || !('SwaggerModule' in swagger)) {
      logger.warn('Swagger module resolved without expected exports');
      return;
    }

    const config = new swagger.DocumentBuilder()
      .setTitle('Mind Stack API')
      .setDescription('HTTP API for ingestion, knowledge, query, and review')
      .setVersion('v1')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .addServer('/api/v1')
      .build();

    const document = swagger.SwaggerModule.createDocument(app, config);
    swagger.SwaggerModule.setup('api/docs', app, document);
    logger.info('Swagger available at /api/docs');
  } catch (error) {
    logger.warn('Swagger disabled because @nestjs/swagger is unavailable', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }
}

async function bootstrap(): Promise<void> {
  const logger = createLogger('API');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  app.enableCors({
    origin: config.getOrThrow<string>('WEB_URL'),
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
  await setupSwagger(app, logger);

  const port = config.getOrThrow<number>('API_PORT');
  await app.listen(port, '0.0.0.0');
  logger.info(`API server running on http://0.0.0.0:${port}`);
}

void bootstrap();
