import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, Image, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  selectedFile?: File | null;
  onClear?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({ onFileSelect, disabled, selectedFile, onClear }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only PDF, PNG, and JPEG files are supported.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${formatBytes(file.size)}). Maximum allowed size is 5 MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const error = validate(file);
      if (error) {
        setValidationError(error);
        return;
      }
      setValidationError(null);
      onFileSelect(file);
    },
    [validate, onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) inputRef.current?.click();
    }
  };

  const handleClear = () => {
    setValidationError(null);
    onClear?.();
  };

  const isPDF = selectedFile?.type === 'application/pdf';

  if (selectedFile) {
    return (
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {isPDF ? (
            <FileText className="w-5 h-5 text-primary" />
          ) : (
            <Image className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {isPDF ? 'PDF Document' : 'Image'} · {formatBytes(selectedFile.size)}
          </p>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/40',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        ].join(' ')}
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop your file here, or{' '}
            <span className="text-primary underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPEG · max 5 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
      {validationError && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  );
}
