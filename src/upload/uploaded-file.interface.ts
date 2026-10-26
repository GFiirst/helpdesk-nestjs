export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredFile {
  storageName: string;
  originalName: string;
  mimeType: string;
  size: number;
}
