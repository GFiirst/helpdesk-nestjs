import { shutdownTelemetry } from './logging/instrumentation';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Express } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService
      .getOrThrow<string>('ORIGIN')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });

  if (configService.getOrThrow<string>('NODE_ENV') === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Helpdesk API')
      .setDescription('Authentication, users, branches, roles, and permissions API')
      .setVersion('1.0')
      .addCookieAuth('access_token', {
        type: 'apiKey',
        in: 'cookie',
      })
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory, {
      customSiteTitle: 'Helpdesk API documentation',
    });
  }

  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set('trust proxy', 1);
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);
  app.get(Logger).log(`Helpdesk API listening on port ${port}`, 'Bootstrap');

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await app.close();
    await shutdownTelemetry();
  };

  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}

void bootstrap();
