export interface UploadedFile {
  originalName: string;
  filename: string;
  size: number;
  type: string;
  path: string;
}

export interface UploadResponse {
  files: UploadedFile[];
  duplicates: Array<{ originalName: string; reason: string }>;
  uploaded: number;
  skipped: number;
} 