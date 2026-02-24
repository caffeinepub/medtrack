export interface FileMetadata {
  fileId: string;
  uploadTimestamp: number;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

export interface ExtractedTestPair {
  testName: string;
  value: string;
}

export interface ExtractedRecordData {
  detectedDate: string | null;
  testNameValuePairs: ExtractedTestPair[];
  rawExtractedText: string;
  suggestedCategory: string | null;
}

export type UploadStatus = 'idle' | 'reading' | 'uploading' | 'extracting' | 'done' | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: number;
  error: string | null;
  fileMetadata: FileMetadata | null;
  extractedData: ExtractedRecordData | null;
}
