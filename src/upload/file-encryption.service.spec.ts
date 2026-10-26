import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { FileEncryptionService } from './file-encryption.service';

describe('FileEncryptionService', () => {
  const key = randomBytes(32).toString('base64');
  const service = new FileEncryptionService(
    new ConfigService({ FILE_ENCRYPTION_KEK: key }),
  );

  it('round-trips encrypted content without storing plaintext', () => {
    const plainText = Buffer.from('confidential attachment');
    const encrypted = service.encrypt(plainText);

    expect(encrypted.includes(plainText)).toBe(false);
    expect(service.decrypt(encrypted)).toEqual(plainText);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = service.encrypt(Buffer.from('attachment'));
    encrypted[encrypted.length - 1] ^= 1;

    expect(() => service.decrypt(encrypted)).toThrow();
  });
});
