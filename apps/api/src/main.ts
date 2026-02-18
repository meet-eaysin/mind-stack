import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module.js";
import { loadConfig } from "@repo/config";
import { createLogger } from "@repo/logger";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger("API");

  const app = await NestFactory.create(AppModule);

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
    })
  );

  app.setGlobalPrefix("api");

  await app.listen(config.API_PORT);
  logger.info(`API server running on port ${config.API_PORT}`);
}

void bootstrap();
