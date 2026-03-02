export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ExtractedRecordEntry {
  category: string;
  metricFields: Record<string, string>;
  date: string | null;
}

export interface ExtractedTestData {
  patientName: string | null;
  records: ExtractedRecordEntry[];
  rawExtractedText: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'extracting' | 'review' | 'saving' | 'success' | 'error';

export interface UploadState {
  status: UploadStatus;
  file: File | null;
  fileId: string | null;
  extractedData: ExtractedTestData | null;
  error: string | null;
}
