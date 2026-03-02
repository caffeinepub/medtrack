import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RECORD_TYPE_LABELS, REFERENCE_RANGES } from '../types/medicalRecords';
import { useDeleteMedicalRecord } from '../hooks/useQueries';
import type { ParsedMedicalRecord } from '../hooks/useQueries';
import { toast } from 'sonner';

interface TimelineCardProps {
  record: ParsedMedicalRecord;
  familyMemberId?: string | null;
}

export function TimelineCard({ record, familyMemberId }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const deleteRecord = useDeleteMedicalRecord();

  const handleDelete = async () => {
    try {
      await deleteRecord.mutateAsync({ recordId: record.recordId, familyMemberId });
      toast.success('Record deleted');
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const categoryLabel =
    RECORD_TYPE_LABELS[record.recordType as keyof typeof RECORD_TYPE_LABELS] ?? record.recordType;

  const recordDate = new Date(Number(record.recordDate));

  const dataEntries = Object.entries(record.data as Record<string, string>).filter(
    ([, v]) => v !== '' && v !== undefined && v !== null
  );

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-4 transition-all hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{categoryLabel}</Badge>
          <span className="text-sm text-muted-foreground">
            {recordDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleteRecord.isPending}
          >
            {deleteRecord.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border">
          {dataEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dataEntries.map(([key, value]) => {
                const range = REFERENCE_RANGES[key];
                const numVal = parseFloat(value);
                const inRange = range && !isNaN(numVal)
                  ? numVal >= range.min && numVal <= range.max
                  : null;
                const label = range?.label ?? key;
                return (
                  <div key={key} className="bg-muted/40 rounded-md p-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium">{value}</p>
                      {range && <span className="text-xs text-muted-foreground">{range.unit}</span>}
                      {inRange !== null && (
                        <span className={`text-xs ml-auto ${inRange ? 'text-success' : 'text-destructive'}`}>
                          {inRange ? '✓' : '!'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
