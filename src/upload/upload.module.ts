import { Module } from '@nestjs/common';
import { FileEncryptionService } from './file-encryption.service';
import { FileStorageService } from './file-storage.service';
import { FileValidatorService } from './file-validator.service';

@Module({
  providers: [FileEncryptionService, FileStorageService, FileValidatorService],
  exports: [FileStorageService, FileValidatorService],
})
export class UploadModule {}
