import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { LoggerModule } from 'nestjs-pino';
import { TransportMultiOptions } from 'pino';

const redactedPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.email',
  'req.body.password',
  'req.body.newPassword',
  'res.headers["set-cookie"]',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'emailEncrypted',
  'emailHash',
];

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logPath = config.getOrThrow<string>('LOG_PATH');
        const retentionDays = config.getOrThrow<number>('LOG_RETENTION_DAYS');
        const fileLoggingEnabled = config.getOrThrow<boolean>('LOG_FILE_ENABLED');
        const targets: Array<TransportMultiOptions['targets'][number]> = [
          {
            target: 'pino/file',
            level: config.getOrThrow<string>('LOG_LEVEL'),
            options: { destination: 1 },
          },
        ];

        if (fileLoggingEnabled) {
          targets.push({
            target: 'pino-roll',
            level: config.getOrThrow<string>('LOG_LEVEL'),
            options: {
              file: join(logPath, 'application.log'),
              frequency: 'daily',
              dateFormat: 'yyyy-MM-dd',
              mkdir: true,
              limit: { count: Math.max(retentionDays - 1, 0) },
            },
          });
        }

        return {
          pinoHttp: {
            level: config.getOrThrow<string>('LOG_LEVEL'),
            transport: { targets },
            redact: { paths: redactedPaths, censor: '[REDACTED]' },
            genReqId: (request, response) => {
              const incomingRequestId = request.headers['x-request-id'];
              const requestId = typeof incomingRequestId === 'string' && incomingRequestId.length <= 128 ? incomingRequestId : randomUUID();
              response.setHeader('x-request-id', requestId);
              return requestId;
            },
            autoLogging: {
              ignore: (request) => request.url === '/health',
            },
            customSuccessMessage: (request, response) => `${request.method} ${request.url} completed with ${response.statusCode}`,
            customErrorMessage: (request, response) => `${request.method} ${request.url} failed with ${response.statusCode}`,
          },
        };
      },
    }),
  ],
})
export class LoggingModule {}
