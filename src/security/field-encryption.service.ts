import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

@Injectable()
export class FieldEncryptionService {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    const encodedKey = configService.getOrThrow<string>('FIELD_ENCRYPTION_KEY');
    this.key = Buffer.from(encodedKey, 'base64');

    if (this.key.length !== KEY_LENGTH) {
      throw new Error('FIELD_ENCRYPTION_KEY must contain exactly 32 Base64-encoded bytes');
    }
  }

  encrypt(value: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
  }

  decrypt(value: string): string {
    const payload = Buffer.from(value, 'base64');
    if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Encrypted field has an invalid format');
    }

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  hashEmail(email: string): string {
    return createHmac('sha256', this.key)
      .update(`email:${this.normalizeEmail(email)}`)
      .digest('hex');
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
