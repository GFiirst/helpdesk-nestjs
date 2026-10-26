import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FileEncryptionService } from './file-encryption.service';
import { FileValidatorService } from './file-validator.service';
import { StoredFile, UploadedFile } from './uploaded-file.interface';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly validator: FileValidatorService,
    private readonly encryption: FileEncryptionService,
  ) {}

  async save(file: UploadedFile): Promise<StoredFile> {
    this.validator.validate(file);
    const storageName = `${randomUUID()}.enc`;
    const directory = this.storageDirectory();
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(
      resolve(directory, storageName),
      this.encryption.encrypt(file.buffer),
      { mode: 0o600, flag: 'wx' },
    );

    return {
      storageName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async read(storageName: string): Promise<Buffer> {
    if (!/^[0-9a-f-]{36}\.enc$/i.test(storageName)) {
      throw new Error('Invalid storage name');
    }

    const encrypted = await readFile(
      resolve(this.storageDirectory(), storageName),
    );
    return this.encryption.decrypt(encrypted);
  }

  private storageDirectory(): string {
    return resolve(this.configService.getOrThrow<string>('FILE_PATH'));
  }
}
