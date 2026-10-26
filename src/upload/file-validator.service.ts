import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { UploadedFile } from './uploaded-file.interface';

interface FileTypeRule {
  mimeTypes: string[];
  matches: (buffer: Buffer) => boolean;
}

const startsWith = (signature: number[]) => (buffer: Buffer) =>
  buffer.length >= signature.length &&
  signature.every((byte, index) => buffer[index] === byte);

const rules: Record<string, FileTypeRule> = {
  '.pdf': {
    mimeTypes: ['application/pdf'],
    matches: (buffer) => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  },
  '.png': {
    mimeTypes: ['image/png'],
    matches: startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  '.jpg': {
    mimeTypes: ['image/jpeg'],
    matches: startsWith([0xff, 0xd8, 0xff]),
  },
  '.jpeg': {
    mimeTypes: ['image/jpeg'],
    matches: startsWith([0xff, 0xd8, 0xff]),
  },
  '.gif': {
    mimeTypes: ['image/gif'],
    matches: (buffer) =>
      /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii')),
  },
  '.webp': {
    mimeTypes: ['image/webp'],
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  '.docx': {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    matches: startsWith([0x50, 0x4b, 0x03, 0x04]),
  },
  '.xlsx': {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    matches: startsWith([0x50, 0x4b, 0x03, 0x04]),
  },
  '.txt': {
    mimeTypes: ['text/plain'],
    matches: (buffer) => !buffer.includes(0),
  },
};

@Injectable()
export class FileValidatorService {
  constructor(private readonly configService: ConfigService) {}

  validate(file: UploadedFile): void {
    const maximumSize = this.configService.getOrThrow<number>('FILE_MAX_BYTES');
    if (!file.buffer.length || file.size !== file.buffer.length) {
      throw new BadRequestException('File content is empty or incomplete');
    }

    if (file.size > maximumSize) {
      throw new BadRequestException('File exceeds the configured size limit');
    }

    const extension = extname(file.originalname).toLowerCase();
    const rule = rules[extension];
    if (!rule) {
      throw new BadRequestException('File extension is not allowed');
    }

    if (!rule.mimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException(
        'File MIME type does not match its extension',
      );
    }

    if (!rule.matches(file.buffer)) {
      throw new BadRequestException(
        'File content does not match its declared type',
      );
    }
  }
}
