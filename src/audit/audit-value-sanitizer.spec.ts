import { AuditValueSanitizer } from './audit-value-sanitizer';

describe('AuditValueSanitizer', () => {
  it('redacts sensitive values recursively', () => {
    expect(
      AuditValueSanitizer.sanitize({
        email: 'user@example.com',
        password: 'secret-value',
        nested: {
          access_token: 'jwt',
          apiKey: 'key',
        },
      }),
    ).toEqual({
      email: 'user@example.com',
      password: '[REDACTED]',
      nested: {
        access_token: '[REDACTED]',
        apiKey: '[REDACTED]',
      },
    });
  });

  it('handles circular objects', () => {
    const value: Record<string, unknown> = { name: 'entity' };
    value.self = value;

    expect(AuditValueSanitizer.sanitize(value)).toEqual({
      name: 'entity',
      self: '[Circular]',
    });
  });
});
