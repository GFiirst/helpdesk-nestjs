export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DB_TYPE: 'postgres';
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SYNC: boolean;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_RESET_SECRET: string;
  JWT_ACCESS_EXPIRATION_MINUTES: number;
  JWT_REFRESH_EXPIRATION_DAYS: number;
  JWT_RESET_EXPIRATION_MINUTES: number;
  COOKIE_SECURE: boolean;
  ORIGIN: string;
  BCRYPT_SALT: number;
  MAX_ACTIVE_SESSIONS: number;
  FRONTEND_URL: string;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_USER: string;
  MAIL_PASS: string;
  FILE_PATH: string;
  FILE_MAX_BYTES: number;
  FILE_ENCRYPTION_KEK: string;
}

const requiredVariables = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  variableName: string,
): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer`);
  }

  return parsed;
}

function parseString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  throw new Error('Expected a boolean value');
}

export function validateEnvironment(
  input: Record<string, unknown>,
): EnvironmentVariables & Record<string, unknown> {
  for (const variableName of requiredVariables) {
    if (
      typeof input[variableName] !== 'string' ||
      !input[variableName].trim()
    ) {
      throw new Error(`${variableName} is required`);
    }
  }

  const nodeEnvironment = parseString(
    input.NODE_ENV ?? input.ENV,
    'development',
  );
  const normalizedEnvironment =
    nodeEnvironment === 'dev' ? 'development' : nodeEnvironment;

  if (!['development', 'test', 'production'].includes(normalizedEnvironment)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const jwtSecret = parseString(input.JWT_SECRET);
  const jwtRefreshSecret = parseString(input.JWT_REFRESH_SECRET);
  const jwtResetSecret = parseString(input.JWT_RESET_SECRET, jwtSecret);
  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  if (normalizedEnvironment === 'production') {
    if (
      jwtSecret.length < 32 ||
      jwtRefreshSecret.length < 32 ||
      jwtResetSecret.length < 32
    ) {
      throw new Error(
        'JWT secrets must contain at least 32 characters in production',
      );
    }

    if (jwtResetSecret === jwtSecret || jwtResetSecret === jwtRefreshSecret) {
      throw new Error('JWT_RESET_SECRET must be different in production');
    }
  }

  return {
    ...input,
    NODE_ENV: normalizedEnvironment as EnvironmentVariables['NODE_ENV'],
    PORT: parsePositiveInteger(input.PORT, 4321, 'PORT'),
    DB_TYPE: 'postgres',
    DB_HOST: parseString(input.DB_HOST),
    DB_PORT: parsePositiveInteger(input.DB_PORT, 5432, 'DB_PORT'),
    DB_USERNAME: parseString(input.DB_USERNAME),
    DB_PASSWORD: parseString(input.DB_PASSWORD),
    DB_NAME: parseString(input.DB_NAME),
    DB_SYNC: parseBoolean(input.DB_SYNC, false),
    JWT_SECRET: jwtSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_RESET_SECRET: jwtResetSecret,
    JWT_ACCESS_EXPIRATION_MINUTES: parsePositiveInteger(
      input.JWT_ACCESS_EXPIRATION_MINUTES,
      15,
      'JWT_ACCESS_EXPIRATION_MINUTES',
    ),
    JWT_REFRESH_EXPIRATION_DAYS: parsePositiveInteger(
      input.JWT_REFRESH_EXPIRATION_DAYS,
      30,
      'JWT_REFRESH_EXPIRATION_DAYS',
    ),
    JWT_RESET_EXPIRATION_MINUTES: parsePositiveInteger(
      input.JWT_RESET_EXPIRATION_MINUTES,
      15,
      'JWT_RESET_EXPIRATION_MINUTES',
    ),
    COOKIE_SECURE: parseBoolean(
      input.COOKIE_SECURE,
      normalizedEnvironment === 'production',
    ),
    ORIGIN: parseString(input.ORIGIN, 'http://localhost:3000'),
    BCRYPT_SALT: parsePositiveInteger(input.BCRYPT_SALT, 12, 'BCRYPT_SALT'),
    MAX_ACTIVE_SESSIONS: parsePositiveInteger(
      input.MAX_ACTIVE_SESSIONS,
      5,
      'MAX_ACTIVE_SESSIONS',
    ),
    FRONTEND_URL: parseString(input.FRONTEND_URL, 'http://localhost:3000'),
    MAIL_HOST: parseString(input.MAIL_HOST, 'smtp.gmail.com'),
    MAIL_PORT: parsePositiveInteger(input.MAIL_PORT, 587, 'MAIL_PORT'),
    MAIL_SECURE: parseBoolean(input.MAIL_SECURE, false),
    MAIL_USER: parseString(input.MAIL_USER),
    MAIL_PASS: parseString(input.MAIL_PASS),
    FILE_PATH: parseString(input.FILE_PATH, 'uploads'),
    FILE_MAX_BYTES: parsePositiveInteger(
      input.FILE_MAX_BYTES,
      10 * 1024 * 1024,
      'FILE_MAX_BYTES',
    ),
    FILE_ENCRYPTION_KEK: parseString(input.FILE_ENCRYPTION_KEK),
  };
}
