import { RecordType } from '../types/medicalRecords';
import {
  CBC_FIELDS,
  LFT_FIELDS,
  CHOLESTEROL_FIELDS,
  BLOOD_SUGAR_FIELDS,
  BLOOD_PRESSURE_FIELDS,
} from '../types/medicalRecords';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryFieldSetProps {
  category: RecordType;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function NumericFieldGroup({
  fields,
  values,
  onChange,
}: {
  fields: Array<{ key: string; label: string; unit: string; placeholder: string }>;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">({field.unit})</span>
          </Label>
          <div className="relative">
            <Input
              id={field.key}
              type="number"
              step="any"
              placeholder={field.placeholder}
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {field.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryFieldSet({ category, values, onChange }: CategoryFieldSetProps) {
  switch (category) {
    case RecordType.CBC:
      return <NumericFieldGroup fields={CBC_FIELDS} values={values} onChange={onChange} />;

    case RecordType.LFT:
      return <NumericFieldGroup fields={LFT_FIELDS} values={values} onChange={onChange} />;

    case RecordType.Cholesterol:
      return <NumericFieldGroup fields={CHOLESTEROL_FIELDS} values={values} onChange={onChange} />;

    case RecordType.BloodSugar:
      return <NumericFieldGroup fields={BLOOD_SUGAR_FIELDS} values={values} onChange={onChange} />;

    case RecordType.BloodPressure:
      return <NumericFieldGroup fields={BLOOD_PRESSURE_FIELDS} values={values} onChange={onChange} />;

    case RecordType.GeneralAilments:
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the ailment, symptoms, or condition..."
              value={values.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="severity" className="text-sm font-medium">
              Severity <span className="text-destructive">*</span>
            </Label>
            <Select value={values.severity || ''} onValueChange={(v) => onChange('severity', v)}>
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes, medications taken, doctor's advice..."
              value={values.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
