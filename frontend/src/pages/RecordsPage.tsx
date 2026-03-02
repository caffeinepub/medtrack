import React, { useState, useMemo } from 'react';
import { FolderOpen, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordsList } from '../components/RecordsList';
import { RecordsFilters, type RecordsFilterState } from '../components/RecordsFilters';
import { FileUploadWithExtraction } from '../components/FileUploadWithExtraction';
import { useListUserFiles, type FileRecord } from '../hooks/useQueries';

export default function RecordsPage() {
  const { data: records = [], isLoading } = useListUserFiles();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filters, setFilters] = useState<RecordsFilterState>({
    search: '',
    fromDate: undefined,
    toDate: undefined,
  });

  const filteredRecords = useMemo<FileRecord[]>(() => {
    return records.filter((record) => {
      // Text search: file name or patient name
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = record.fileName.toLowerCase().includes(q);
        const matchesPatient = record.patientName?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesPatient) return false;
      }

      // Date range filter (uses uploadTimestamp)
      if (filters.fromDate) {
        const from = filters.fromDate.getTime();
        if (record.uploadTimestamp < from) return false;
      }
      if (filters.toDate) {
        // Include the full "to" day
        const to = new Date(filters.toDate);
        to.setHours(23, 59, 59, 999);
        if (record.uploadTimestamp > to.getTime()) return false;
      }

      return true;
    });
  }, [records, filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
            <p className="text-sm text-muted-foreground">
              {records.length} {records.length === 1 ? 'record' : 'records'} stored securely
            </p>
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Upload Record
        </Button>
      </div>

      {/* Filters */}
      {records.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <RecordsFilters filters={filters} onChange={setFilters} />
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 rounded-t-lg rounded-b-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <RecordsList records={filteredRecords} />
      )}

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Medical Record</DialogTitle>
          </DialogHeader>
          <FileUploadWithExtraction
            onSuccess={() => setUploadOpen(false)}
            onCancel={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
