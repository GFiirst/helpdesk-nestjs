import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const MAGIC = Buffer.from('HDSK1');
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const HEADER_LENGTH =
  MAGIC.length + IV_LENGTH + TAG_LENGTH + KEY_LENGTH + IV_LENGTH + TAG_LENGTH;

@Injectable()
export class FileEncryptionService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(plainText: Buffer): Buffer {
    const keyEncryptionKey = this.getKeyEncryptionKey();
    const dataEncryptionKey = randomBytes(KEY_LENGTH);
    const dataIv = randomBytes(IV_LENGTH);
    const dataCipher = createCipheriv('aes-256-gcm', dataEncryptionKey, dataIv);
    const cipherText = Buffer.concat([
      dataCipher.update(plainText),
      dataCipher.final(),
    ]);
    const dataTag = dataCipher.getAuthTag();

    const keyIv = randomBytes(IV_LENGTH);
    const keyCipher = createCipheriv('aes-256-gcm', keyEncryptionKey, keyIv);
    const encryptedDataKey = Buffer.concat([
      keyCipher.update(dataEncryptionKey),
      keyCipher.final(),
    ]);
    const keyTag = keyCipher.getAuthTag();

    return Buffer.concat([
      MAGIC,
      keyIv,
      keyTag,
      encryptedDataKey,
      dataIv,
      dataTag,
      cipherText,
    ]);
  }

  decrypt(encrypted: Buffer): Buffer {
    if (
      encrypted.length < HEADER_LENGTH ||
      !encrypted.subarray(0, MAGIC.length).equals(MAGIC)
    ) {
      throw new Error('Encrypted file has an invalid format');
    }

    let offset = MAGIC.length;
    const keyIv = encrypted.subarray(offset, (offset += IV_LENGTH));
    const keyTag = encrypted.subarray(offset, (offset += TAG_LENGTH));
    const encryptedDataKey = encrypted.subarray(offset, (offset += KEY_LENGTH));
    const dataIv = encrypted.subarray(offset, (offset += IV_LENGTH));
    const dataTag = encrypted.subarray(offset, (offset += TAG_LENGTH));
    const cipherText = encrypted.subarray(offset);

    const keyDecipher = createDecipheriv(
      'aes-256-gcm',
      this.getKeyEncryptionKey(),
      keyIv,
    );
    keyDecipher.setAuthTag(keyTag);
    const dataEncryptionKey = Buffer.concat([
      keyDecipher.update(encryptedDataKey),
      keyDecipher.final(),
    ]);

    const dataDecipher = createDecipheriv(
      'aes-256-gcm',
      dataEncryptionKey,
      dataIv,
    );
    dataDecipher.setAuthTag(dataTag);
    return Buffer.concat([
      dataDecipher.update(cipherText),
      dataDecipher.final(),
    ]);
  }

  private getKeyEncryptionKey(): Buffer {
    const encodedKey = this.configService.getOrThrow<string>(
      'FILE_ENCRYPTION_KEK',
    );
    const key = Buffer.from(encodedKey, 'base64');

    if (!encodedKey || key.length !== KEY_LENGTH) {
      throw new ServiceUnavailableException(
        'FILE_ENCRYPTION_KEK must contain exactly 32 Base64-encoded bytes',
      );
    }

    return key;
  }
}
