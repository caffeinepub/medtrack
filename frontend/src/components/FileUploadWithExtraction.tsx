import React, { useState, useCallback } from 'react';
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUploadZone } from './FileUploadZone';
import { extractMedicalData } from '../lib/ocrExtraction';
import { useUploadFile } from '../hooks/useQueries';
import { toast } from 'sonner';

interface FileUploadWithExtractionProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = 'select' | 'extracting' | 'review' | 'uploading' | 'done';

export function FileUploadWithExtraction({ onSuccess, onCancel }: FileUploadWithExtractionProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [patientName, setPatientName] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useUploadFile();

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setStep('extracting');
    setExtractionError(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setFileBytes(bytes);

      // Run OCR extraction
      const extracted = await extractMedicalData(bytes, file.type);
      setPatientName(extracted.patientName ?? '');
      // Use first record's date if available
      const firstDate = extracted.records?.[0]?.date ?? '';
      setRecordDate(firstDate);
      setStep('review');
    } catch (err) {
      setExtractionError('Could not extract data automatically. Please fill in the fields manually.');
      setStep('review');
    }
  }, []);

  const handleSubmit = async () => {
    if (!fileBytes || !selectedFile) return;
    setStep('uploading');
    setUploadProgress(0);

    try {
      await uploadFile.mutateAsync({
        fileBytes,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        patientName: patientName || undefined,
        recordDate: recordDate || undefined,
        onProgress: setUploadProgress,
      });
      setStep('done');
      toast.success('Medical record uploaded successfully');
      onSuccess?.();
    } catch {
      toast.error('Failed to upload record. Please try again.');
      setStep('review');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedFile(null);
    setFileBytes(null);
    setPatientName('');
    setRecordDate('');
    setExtractionError(null);
    setUploadProgress(0);
  };

  if (step === 'select') {
    return (
      <div className="space-y-4">
        <FileUploadZone onFileSelect={handleFileSelect} />
        {onCancel && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'extracting') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Extracting data from your document…</p>
        <p className="text-xs text-muted-foreground">{selectedFile?.name}</p>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate font-medium text-foreground">{selectedFile?.name}</span>
        </div>

        {extractionError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{extractionError}</AlertDescription>
          </Alert>
        )}

        {!extractionError && (patientName || recordDate) && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              Data extracted automatically. Please review and correct if needed.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="patientName">Patient Name</Label>
            <Input
              id="patientName"
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recordDate">Record Date</Label>
            <Input
              id="recordDate"
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={handleReset}>
            Choose Different File
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          )}
          <Button onClick={handleSubmit} disabled={!fileBytes}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Record
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Uploading your record…</p>
        <div className="w-full max-w-xs">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground mt-1">{uploadProgress}%</p>
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <CheckCircle className="w-12 h-12 text-primary" />
      <p className="text-base font-semibold">Record uploaded successfully!</p>
      <Button onClick={handleReset}>Upload Another</Button>
    </div>
  );
}
