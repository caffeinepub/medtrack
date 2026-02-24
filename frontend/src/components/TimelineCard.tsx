import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
import { RecordType, RECORD_TYPE_LABELS, RECORD_TYPE_COLORS, REFERENCE_RANGES } from '../types/medicalRecords';
import type { ParsedMedicalRecord } from '../types/medicalRecords';
import { useDeleteMedicalRecord } from '../hooks/useQueries';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface TimelineCardProps {
  record: ParsedMedicalRecord;
}

function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRecordSummary(record: ParsedMedicalRecord): string {
  const data = record.data as unknown as Record<string, string>;
  switch (record.recordType) {
    case RecordType.CBC:
      return `Hgb: ${data.hemoglobin || '—'} g/dL · WBC: ${data.wbc || '—'} K/µL · Plt: ${data.platelets || '—'} K/µL`;
    case RecordType.LFT:
      return `ALT: ${data.alt || '—'} · AST: ${data.ast || '—'} · Bili: ${data.bilirubin || '—'} mg/dL`;
    case RecordType.Cholesterol:
      return `Total: ${data.total || '—'} · HDL: ${data.hdl || '—'} · LDL: ${data.ldl || '—'} mg/dL`;
    case RecordType.BloodSugar:
      return `Fasting: ${data.fasting || '—'} · Post-meal: ${data.postMeal || '—'} mg/dL · HbA1c: ${data.hba1c || '—'}%`;
    case RecordType.BloodPressure:
      return `${data.systolic || '—'}/${data.diastolic || '—'} mmHg · Pulse: ${data.pulse || '—'} bpm`;
    case RecordType.GeneralAilments:
      return `${data.description?.slice(0, 80) || '—'}${(data.description?.length || 0) > 80 ? '...' : ''} · Severity: ${data.severity || '—'}`;
    default:
      return '';
  }
}

function MetricRow({ label, value, unit, metricKey }: { label: string; value: string; unit: string; metricKey: string }) {
  const numVal = parseFloat(value);
  const range = REFERENCE_RANGES[metricKey];
  const inRange = range && !isNaN(numVal) ? numVal >= range.min && numVal <= range.max : null;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium tabular-nums">
          {value || '—'} {value ? unit : ''}
        </span>
        {inRange !== null && value && (
          <span className={`w-2 h-2 rounded-full ${inRange ? 'bg-success' : 'bg-destructive'}`} title={inRange ? 'In range' : 'Out of range'} />
        )}
      </div>
    </div>
  );
}

export function TimelineCard({ record }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const deleteRecord = useDeleteMedicalRecord();
  const data = record.data as unknown as Record<string, string>;

  async function handleDelete() {
    try {
      await deleteRecord.mutateAsync(record.recordId);
      toast.success('Record deleted');
    } catch {
      toast.error('Failed to delete record');
    }
  }

  function renderExpandedContent() {
    switch (record.recordType) {
      case RecordType.CBC:
        return (
          <div>
            <MetricRow label="WBC" value={data.wbc} unit="K/µL" metricKey="wbc" />
            <MetricRow label="RBC" value={data.rbc} unit="M/µL" metricKey="rbc" />
            <MetricRow label="Hemoglobin" value={data.hemoglobin} unit="g/dL" metricKey="hemoglobin" />
            <MetricRow label="Hematocrit" value={data.hematocrit} unit="%" metricKey="hematocrit" />
            <MetricRow label="Platelets" value={data.platelets} unit="K/µL" metricKey="platelets" />
          </div>
        );
      case RecordType.LFT:
        return (
          <div>
            <MetricRow label="ALT" value={data.alt} unit="U/L" metricKey="alt" />
            <MetricRow label="AST" value={data.ast} unit="U/L" metricKey="ast" />
            <MetricRow label="ALP" value={data.alp} unit="U/L" metricKey="alp" />
            <MetricRow label="Bilirubin" value={data.bilirubin} unit="mg/dL" metricKey="bilirubin" />
            <MetricRow label="Albumin" value={data.albumin} unit="g/dL" metricKey="albumin" />
          </div>
        );
      case RecordType.Cholesterol:
        return (
          <div>
            <MetricRow label="Total Cholesterol" value={data.total} unit="mg/dL" metricKey="total" />
            <MetricRow label="HDL" value={data.hdl} unit="mg/dL" metricKey="hdl" />
            <MetricRow label="LDL" value={data.ldl} unit="mg/dL" metricKey="ldl" />
            <MetricRow label="Triglycerides" value={data.triglycerides} unit="mg/dL" metricKey="triglycerides" />
          </div>
        );
      case RecordType.BloodSugar:
        return (
          <div>
            <MetricRow label="Fasting Glucose" value={data.fasting} unit="mg/dL" metricKey="fasting" />
            <MetricRow label="Post-meal Glucose" value={data.postMeal} unit="mg/dL" metricKey="postMeal" />
            <MetricRow label="HbA1c" value={data.hba1c} unit="%" metricKey="hba1c" />
          </div>
        );
      case RecordType.BloodPressure:
        return (
          <div>
            <MetricRow label="Systolic" value={data.systolic} unit="mmHg" metricKey="systolic" />
            <MetricRow label="Diastolic" value={data.diastolic} unit="mmHg" metricKey="diastolic" />
            <MetricRow label="Pulse" value={data.pulse} unit="bpm" metricKey="pulse" />
          </div>
        );
      case RecordType.GeneralAilments:
        return (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{data.description || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Severity</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                data.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                data.severity === 'severe' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                data.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {data.severity || '—'}
              </span>
            </div>
            {data.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{data.notes}</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-200 animate-fade-in">
      <CardContent className="p-0">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-4 flex items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`metric-badge ${RECORD_TYPE_COLORS[record.recordType]}`}>
                {RECORD_TYPE_LABELS[record.recordType]}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(record.recordDate)}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{getRecordSummary(record)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
            {renderExpandedContent()}
            <div className="mt-4 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Record</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this {RECORD_TYPE_LABELS[record.recordType]} record from {formatDate(record.recordDate)}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteRecord.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
