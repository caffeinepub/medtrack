import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { FileRecord } from '../hooks/useQueries';

interface FileViewerModalProps {
  record: FileRecord | null;
  open: boolean;
  onClose: () => void;
}

export function FileViewerModal({ record, open, onClose }: FileViewerModalProps) {
  if (!record) return null;

  const isPDF = record.mimeType === 'application/pdf';
  const isImage = record.mimeType.startsWith('image/');
  const fileUrl = record.blob.getDirectURL();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold truncate max-w-md">
              {record.fileName}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={fileUrl} download={record.fileName} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          {isPDF && (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={record.fileName}
            />
          )}
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={fileUrl}
                alt={record.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          {!isPDF && !isImage && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <FileText className="w-16 h-16" />
              <p>Preview not available for this file type.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
