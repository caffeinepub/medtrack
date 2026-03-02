import React, { useState } from 'react';
import { FileText, Image, Trash2, Eye, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileViewerModal } from './FileViewerModal';
import { useDeleteUploadedFile, type FileRecord } from '../hooks/useQueries';

interface RecordsListProps {
  records: FileRecord[];
}

export function RecordsList({ records }: RecordsListProps) {
  const [viewingRecord, setViewingRecord] = useState<FileRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteFile = useDeleteUploadedFile();

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteFile.mutateAsync({ fileId: deletingId, isTemporary: false });
      toast.success('Record deleted successfully');
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No records found</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Upload your first medical record to get started. PDFs and images are supported.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => {
          const isPDF = record.mimeType === 'application/pdf';
          const isImage = record.mimeType.startsWith('image/');
          const uploadDate = new Date(record.uploadTimestamp);

          return (
            <Card
              key={record.fileId}
              className="group hover:shadow-md transition-shadow cursor-pointer border border-border"
              onClick={() => setViewingRecord(record)}
            >
              {/* Thumbnail / Preview */}
              <div className="relative h-40 bg-muted/40 rounded-t-lg overflow-hidden flex items-center justify-center border-b border-border">
                {isImage ? (
                  <img
                    src={record.blob.getDirectURL()}
                    alt={record.fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="w-12 h-12 text-primary/60" />
                    <span className="text-xs font-medium uppercase tracking-wide">PDF</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant={isPDF ? 'default' : 'secondary'} className="text-xs">
                    {isPDF ? (
                      <><FileText className="w-3 h-3 mr-1" />PDF</>
                    ) : (
                      <><Image className="w-3 h-3 mr-1" />{record.mimeType === 'image/png' ? 'PNG' : 'JPEG'}</>
                    )}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate" title={record.fileName}>
                      {record.fileName}
                    </p>

                    <div className="mt-2 space-y-1">
                      {record.patientName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">{record.patientName}</span>
                        </div>
                      )}
                      {record.recordDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{record.recordDate}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Uploaded {format(uploadDate, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(record.fileId);
                    }}
                    disabled={deleteFile.isPending && deletingId === record.fileId}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* File Viewer Modal */}
      <FileViewerModal
        record={viewingRecord}
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this medical record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFile.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
