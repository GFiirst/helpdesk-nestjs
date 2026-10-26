import { validateEnvironment } from './environment';

const validEnvironment = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'helpdesk',
  JWT_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
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
    });
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
});
