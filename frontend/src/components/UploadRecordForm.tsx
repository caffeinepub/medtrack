import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileUploadZone } from './FileUploadZone';
import { CategoryFieldSet } from './CategoryFieldSet';
import { useAddMedicalRecord, useUploadFile } from '../hooks/useQueries';
import { RecordType, RECORD_TYPE_LABELS } from '../types/medicalRecords';
import type { RecordData } from '../types/medicalRecords';
import type { ExtractedRecordData, UploadStatus } from '../types/fileUpload';
import { extractRecordData } from '../lib/ocrExtraction';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  ScanText,
  Info,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: RecordType.CBC, label: 'CBC – Complete Blood Count' },
  { value: RecordType.LFT, label: 'LFT – Liver Function Test' },
  { value: RecordType.Cholesterol, label: 'Cholesterol Panel' },
  { value: RecordType.BloodSugar, label: 'Blood Sugar' },
  { value: RecordType.BloodPressure, label: 'Blood Pressure' },
  { value: RecordType.GeneralAilments, label: 'General Ailment' },
];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  idle: '',
  reading: 'Reading file…',
  uploading: 'Uploading file…',
  extracting: 'Extracting data…',
  done: 'Extraction complete',
  error: 'Extraction failed',
};

const STATUS_PROGRESS: Record<UploadStatus, number> = {
  idle: 0,
  reading: 20,
  uploading: 55,
  extracting: 80,
  done: 100,
  error: 100,
};

export function UploadRecordForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedRecordData | null>(null);
  const [rawTextOpen, setRawTextOpen] = useState(false);

  // Form state (pre-populated from OCR)
  const [category, setCategory] = useState<RecordType>(RecordType.CBC);
  const [date, setDate] = useState(getTodayString());
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addRecord = useAddMedicalRecord();
  const uploadFile = useUploadFile();

  const isProcessing = ['reading', 'uploading', 'extracting'].includes(uploadStatus);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleCategoryChange = (value: RecordType) => {
    setCategory(value);
    setFieldValues({});
    setFormErrors({});
  };

  const applyExtractedData = useCallback((data: ExtractedRecordData, detectedCategory: RecordType) => {
    if (data.detectedDate) {
      setDate(data.detectedDate);
    }
    setCategory(detectedCategory);

    const newValues: Record<string, string> = {};
    for (const pair of data.testNameValuePairs) {
      newValues[pair.testName] = pair.value;
    }
    setFieldValues(newValues);
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    setExtractedData(null);
    setFieldValues({});
    setFormErrors({});

    try {
      // Step 1: Read file bytes
      setUploadStatus('reading');
      const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;

      // Step 2: Upload to backend
      setUploadStatus('uploading');
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await uploadFile.mutateAsync({ bytes, fileId, mimeType: file.type });

      // Step 3: Extract data client-side
      setUploadStatus('extracting');
      const extracted = await extractRecordData(bytes, file.type);
      setExtractedData(extracted);

      // Determine category
      let detectedCategory: RecordType = RecordType.CBC;
      if (extracted.suggestedCategory) {
        const catMap: Record<string, RecordType> = {
          CBC: RecordType.CBC,
          LFT: RecordType.LFT,
          Cholesterol: RecordType.Cholesterol,
          BloodSugar: RecordType.BloodSugar,
          BloodPressure: RecordType.BloodPressure,
        };
        detectedCategory = catMap[extracted.suggestedCategory] ?? RecordType.CBC;
      }

      applyExtractedData(extracted, detectedCategory);
      setUploadStatus('done');

      if (extracted.testNameValuePairs.length === 0) {
        toast.warning('No test values detected', {
          description: 'Could not automatically extract test results. Please fill in the fields manually.',
        });
      } else {
        toast.success(`Extracted ${extracted.testNameValuePairs.length} test value(s)`, {
          description: 'Review and edit the pre-filled fields before saving.',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setUploadError(message);
      setUploadStatus('error');
      toast.error('Failed to process file', { description: message });
    }
  }, [uploadFile, applyExtractedData]);

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadError(null);
    setExtractedData(null);
    setFieldValues({});
    setFormErrors({});
    setDate(getTodayString());
    setCategory(RecordType.CBC);
  };

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'Date is required';
    if (category === RecordType.GeneralAilments) {
      if (!fieldValues.description?.trim()) newErrors.description = 'Description is required';
      if (!fieldValues.severity) newErrors.severity = 'Severity is required';
    } else {
      const hasAnyValue = Object.values(fieldValues).some((v) => v.trim() !== '');
      if (!hasAnyValue) newErrors._general = 'Please fill in at least one field';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const recordDate = BigInt(new Date(date).getTime());
    try {
      await addRecord.mutateAsync({
        recordId: generateId(),
        recordDate,
        recordType: category,
        data: fieldValues as unknown as RecordData,
      });
      toast.success('Record saved successfully!', {
        description: `${RECORD_TYPE_LABELS[category]} record for ${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} has been added.`,
      });
      handleClearFile();
    } catch {
      toast.error('Failed to save record', { description: 'Please try again.' });
    }
  }

  const showForm = uploadStatus === 'done' || uploadStatus === 'error';

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Upload Medical Report</Label>
        <FileUploadZone
          onFileSelected={handleFileSelected}
          disabled={isProcessing}
          selectedFile={selectedFile}
          onClear={handleClearFile}
        />
      </div>

      {/* Processing progress */}
      {isProcessing && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{STATUS_LABELS[uploadStatus]}</span>
          </div>
          <Progress value={STATUS_PROGRESS[uploadStatus]} className="h-1.5" />
        </div>
      )}

      {/* Error state */}
      {uploadStatus === 'error' && uploadError && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Extraction Failed</AlertTitle>
          <AlertDescription>{uploadError}. You can still fill in the form manually below.</AlertDescription>
        </Alert>
      )}

      {/* Extraction success summary */}
      {uploadStatus === 'done' && extractedData && (
        <div className="animate-fade-in space-y-3">
          {extractedData.testNameValuePairs.length > 0 ? (
            <Alert className="border-success/30 bg-success/5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">Data Extracted Successfully</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Found {extractedData.testNameValuePairs.length} test value(s)
                {extractedData.detectedDate ? ` and date ${extractedData.detectedDate}` : ''}.
                Review and edit the fields below before saving.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-warning/30 bg-warning/5">
              <Info className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning-foreground">No Values Detected</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Could not automatically extract test results from this file. Please fill in the fields manually.
              </AlertDescription>
            </Alert>
          )}

          {/* Raw extracted text collapsible */}
          {extractedData.rawExtractedText.trim().length > 0 && (
            <Collapsible open={rawTextOpen} onOpenChange={setRawTextOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                >
                  <ScanText className="w-3.5 h-3.5" />
                  <span>View extracted text</span>
                  {rawTextOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {extractedData.rawExtractedText || '(no readable text found)'}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Form — shown after processing or on error */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>Record Details</span>
              <span className="text-xs font-normal text-muted-foreground">(review and edit before saving)</span>
            </h3>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="upload-category" className="text-sm font-medium">
                Record Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => handleCategoryChange(v as RecordType)}>
                <SelectTrigger id="upload-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload-date" className="text-sm font-medium">
                Record Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload-date"
                type="date"
                value={date}
                max={getTodayString()}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (formErrors.date) setFormErrors((prev) => { const n = { ...prev }; delete n.date; return n; });
                }}
                className={formErrors.date ? 'border-destructive' : ''}
              />
              {formErrors.date && <p className="text-xs text-destructive">{formErrors.date}</p>}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Dynamic fields */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {RECORD_TYPE_LABELS[category]} Metrics
            </h3>
            <CategoryFieldSet
              category={category}
              values={fieldValues}
              onChange={handleFieldChange}
            />
            {formErrors._general && <p className="mt-2 text-xs text-destructive">{formErrors._general}</p>}
            {formErrors.description && <p className="mt-2 text-xs text-destructive">{formErrors.description}</p>}
            {formErrors.severity && <p className="mt-2 text-xs text-destructive">{formErrors.severity}</p>}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={addRecord.isPending}
              className="min-w-[140px]"
            >
              {addRecord.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Record
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Idle hint when no file selected yet */}
      {uploadStatus === 'idle' && !selectedFile && (
        <p className="text-xs text-center text-muted-foreground">
          Upload a lab report PDF or photo — dates and test values will be detected automatically.
        </p>
      )}
    </div>
  );
}
