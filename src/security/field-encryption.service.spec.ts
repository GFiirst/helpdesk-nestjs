import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { FieldEncryptionService } from './field-encryption.service';

describe('FieldEncryptionService', () => {
  const service = new FieldEncryptionService(new ConfigService({ FIELD_ENCRYPTION_KEY: randomBytes(32).toString('base64') }));

  it('encrypts and decrypts field values', () => {
    const encrypted = service.encrypt('user@example.com');

    expect(encrypted).not.toContain('user@example.com');
    expect(service.decrypt(encrypted)).toBe('user@example.com');
  });

  it('uses random ciphertext and a stable normalized email hash', () => {
    expect(service.encrypt('user@example.com')).not.toBe(service.encrypt('user@example.com'));
    expect(service.hashEmail(' User@Example.com ')).toBe(service.hashEmail('user@example.com'));
  });

  it('rejects tampered encrypted values', () => {
    const encrypted = Buffer.from(service.encrypt('user@example.com'), 'base64');
    encrypted[encrypted.length - 1] ^= 1;

    expect(() => service.decrypt(encrypted.toString('base64'))).toThrow();
  });
});
