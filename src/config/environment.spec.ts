import { validateEnvironment } from './environment';

const validEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'helpdesk',
  JWT_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  FIELD_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
};

describe('validateEnvironment', () => {
  it('applies safe development defaults and converts primitive values', () => {
    const environment = validateEnvironment({
      ...validEnvironment,
      PORT: '4321',
      DB_SYNC: 'false',
    });

    expect(environment).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4321,
      DB_PORT: 5432,
      DB_SYNC: false,
      COOKIE_SECURE: false,
      JWT_ACCESS_EXPIRATION_MINUTES: 15,
      JWT_REFRESH_EXPIRATION_DAYS: 30,
      LOG_LEVEL: 'info',
      LOG_PATH: 'logs',
      LOG_RETENTION_DAYS: 15,
      LOG_FILE_ENABLED: true,
      OTEL_ENABLED: false,
      OTEL_SERVICE_NAME: 'helpdesk-nestjs',
      OTEL_SERVICE_VERSION: '0.0.1',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4317',
      OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc',
      SEED_DATABASE_ON_STARTUP: true,
    });
  });

  it('disables startup seeding by default in tests', () => {
    const environment = validateEnvironment({
      ...validEnvironment,
      NODE_ENV: 'test',
    });

    expect(environment.SEED_DATABASE_ON_STARTUP).toBe(false);
  });

  it('rejects equal access and refresh secrets', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_REFRESH_SECRET: validEnvironment.JWT_SECRET,
      }),
    ).toThrow('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  });

  it('requires long secrets in production', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('JWT secrets must contain at least 32 characters in production');
  });

  it('rejects an invalid field encryption key', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        FIELD_ENCRYPTION_KEY: 'invalid',
      }),
    ).toThrow('FIELD_ENCRYPTION_KEY must contain exactly 32 Base64-encoded bytes');
  });

  it('rejects an unsupported OTLP protocol', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        OTEL_EXPORTER_OTLP_PROTOCOL: 'json',
      }),
    ).toThrow('OTEL_EXPORTER_OTLP_PROTOCOL must be grpc or http/protobuf');
  });
});
