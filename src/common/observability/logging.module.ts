import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { LoggerModule } from 'nestjs-pino';
import { TransportMultiOptions } from 'pino';

const nestFrameworkContexts = new Set(['InstanceLoader', 'NestApplication', 'NestFactory', 'RouterExplorer', 'RoutesResolver']);

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
        const logLevel = config.getOrThrow<string>('LOG_LEVEL');
        const formatterTarget = join(__dirname, 'serilog-log-formatter.transport.js');
        const targets: Array<TransportMultiOptions['targets'][number]> = [
          {
            level: logLevel,
            pipeline: [{ target: formatterTarget }, { target: 'pino/file', options: { destination: 1 } }],
          },
        ];

        if (fileLoggingEnabled) {
          targets.push({
            level: logLevel,
            pipeline: [
              { target: formatterTarget },
              {
                target: 'pino-roll',
                options: {
                  file: join(logPath, 'log.txt'),
                  frequency: 'daily',
                  dateFormat: 'yyyy-MM-dd',
                  mkdir: true,
                  limit: { count: Math.max(retentionDays - 1, 1) },
                },
              },
            ],
          });
        }

        return {
          pinoHttp: {
            base: undefined,
            level: logLevel,
            transport: { targets },
            redact: { paths: redactedPaths, censor: '[REDACTED]' },
            hooks: {
              logMethod(args, method, level) {
                const firstArgument = args[0];
                const context =
                  firstArgument && typeof firstArgument === 'object' && 'context' in firstArgument ? firstArgument.context : undefined;
                if (level < 40 && typeof context === 'string' && nestFrameworkContexts.has(context)) return;
                method.apply(this, args);
              },
            },
            genReqId: (request, response) => {
              const incomingRequestId = request.headers['x-request-id'];
              const requestId = typeof incomingRequestId === 'string' && incomingRequestId.length <= 128 ? incomingRequestId : randomUUID();
              response.setHeader('x-request-id', requestId);
              return requestId;
            },
            autoLogging: {
              ignore: (request) => request.url === '/health',
            },
            customProps: () => ({ context: 'HTTP' }),
            customSuccessMessage: (request, response, responseTime) =>
              `HTTP "${request.method}" "${request.url}" responded ${response.statusCode} in ${responseTime.toFixed(4)} ms`,
            customErrorMessage: (request, response) => `HTTP "${request.method}" "${request.url}" failed with ${response.statusCode}`,
          },
        };
      },
    }),
  ],
})
export class LoggingModule {}
