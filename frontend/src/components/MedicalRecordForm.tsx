import { useState } from 'react';
import { toast } from 'sonner';
import { RecordType, RECORD_TYPE_LABELS } from '../types/medicalRecords';
import type { RecordData } from '../types/medicalRecords';
import { CategoryFieldSet } from './CategoryFieldSet';
import { useAddMedicalRecord, useListFamilyMembers } from '../hooks/useQueries';
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
import { Loader2, Save } from 'lucide-react';

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

export function MedicalRecordForm() {
  const [category, setCategory] = useState<RecordType>(RecordType.CBC);
  const [date, setDate] = useState(getTodayString());
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [familyMemberId, setFamilyMemberId] = useState<string>('__personal__');

  const addRecord = useAddMedicalRecord();
  const { data: familyMembers = [] } = useListFamilyMembers();

  function handleFieldChange(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleCategoryChange(value: RecordType) {
    setCategory(value);
    setFieldValues({});
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (category === RecordType.GeneralAilments) {
      if (!fieldValues.description?.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!fieldValues.severity) {
        newErrors.severity = 'Severity is required';
      }
    } else {
      const hasAnyValue = Object.values(fieldValues).some((v) => v.trim() !== '');
      if (!hasAnyValue) {
        newErrors._general = 'Please fill in at least one field';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const recordDate = BigInt(new Date(date).getTime());
    const memberId = familyMemberId === '__personal__' ? null : familyMemberId;

    try {
      await addRecord.mutateAsync({
        recordId: generateId(),
        recordDate,
        recordType: category,
        data: JSON.stringify(fieldValues as unknown as RecordData),
        familyMemberId: memberId,
      });

      const memberName =
        memberId === null
          ? 'My Records'
          : familyMembers.find((m) => m.profileId === memberId)?.name ?? 'Family Member';

      toast.success('Record saved successfully!', {
        description: `${RECORD_TYPE_LABELS[category]} record added to ${memberName}.`,
      });
      setFieldValues({});
      setDate(getTodayString());
      setErrors({});
    } catch {
      toast.error('Failed to save record', {
        description: 'Please try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Family member selector */}
      <div className="space-y-1.5">
        <Label htmlFor="family-member" className="text-sm font-medium">
          Add to Profile
        </Label>
        <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
          <SelectTrigger id="family-member">
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__personal__">My Records (Personal)</SelectItem>
            {familyMembers.map((m) => (
              <SelectItem key={m.profileId} value={m.profileId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category & Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-sm font-medium">
            Record Category <span className="text-destructive">*</span>
          </Label>
          <Select value={category} onValueChange={(v) => handleCategoryChange(v as RecordType)}>
            <SelectTrigger id="category">
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
          <Label htmlFor="date" className="text-sm font-medium">
            Record Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            max={getTodayString()}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date)
                setErrors((prev) => {
                  const n = { ...prev };
                  delete n.date;
                  return n;
                });
            }}
            className={errors.date ? 'border-destructive' : ''}
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>
      </div>

      {/* Divider */}
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
        {errors._general && (
          <p className="mt-2 text-xs text-destructive">{errors._general}</p>
        )}
        {errors.description && (
          <p className="mt-2 text-xs text-destructive">{errors.description}</p>
        )}
        {errors.severity && (
          <p className="mt-2 text-xs text-destructive">{errors.severity}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={addRecord.isPending} className="min-w-[140px]">
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
  );
}
