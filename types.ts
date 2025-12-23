export enum ProcessStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface ImageTask {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  status: ProcessStatus;
  error?: string;
  thumbnailUrl: string;
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
}