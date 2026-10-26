import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidatorService } from './file-validator.service';

describe('FileValidatorService', () => {
  const service = new FileValidatorService(
    new ConfigService({ FILE_MAX_BYTES: 1024 }),
  );

  it('accepts a file whose extension, MIME type, and signature agree', () => {
    const buffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);

    expect(() =>
      service.validate({
        originalname: 'image.png',
        mimetype: 'image/png',
        size: buffer.length,
        buffer,
      }),
    ).not.toThrow();
  });

  it('rejects spoofed file content', () => {
    const buffer = Buffer.from('not a png');

    expect(() =>
      service.validate({
        originalname: 'image.png',
        mimetype: 'image/png',
        size: buffer.length,
        buffer,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects disallowed extensions', () => {
    const buffer = Buffer.from('executable');

    expect(() =>
      service.validate({
        originalname: 'payload.exe',
        mimetype: 'application/octet-stream',
        size: buffer.length,
        buffer,
      }),
    ).toThrow('File extension is not allowed');
  });
});
