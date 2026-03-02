import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, CheckCircle, AlertCircle, Loader2, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from './FileUploadZone';
import { CategoryFieldSet } from './CategoryFieldSet';
import { extractFromFile } from '../lib/ocrExtraction';
import type { ExtractedTestData, ExtractedRecordEntry } from '../types/fileUpload';
import { useUploadFile, useAddMedicalRecord, useListFamilyMembers, useCreateFamilyMember } from '../hooks/useQueries';
import { RecordType } from '../backend';

const CATEGORY_TO_RECORD_TYPE: Record<string, RecordType> = {
  CBC: RecordType.CBC,
  LFT: RecordType.LFT,
  Cholesterol: RecordType.Cholesterol,
  BloodSugar: RecordType.BloodSugar,
  BloodPressure: RecordType.BloodPressure,
  GeneralAilments: RecordType.GeneralAilments,
};

type ReviewRecord = ExtractedRecordEntry & {
  editedFields: Record<string, string>;
  editedDate: string;
};

export function UploadRecordForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTestData | null>(null);
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('__personal__');
  const [newMemberName, setNewMemberName] = useState('');
  const [showNewMemberInput, setShowNewMemberInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const uploadFile = useUploadFile();
  const addRecord = useAddMedicalRecord();
  const createFamilyMember = useCreateFamilyMember();
  const { data: familyMembers = [] } = useListFamilyMembers();

  const handleFileSelected = useCallback(async (file: File) => {
    setSelectedFile(file);
    setExtractedData(null);
    setReviewRecords([]);
    setIsExtracting(true);

    try {
      const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const result = await extractFromFile(bytes);
      setExtractedData(result);

      const reviews: ReviewRecord[] = result.records.map((r) => ({
        ...r,
        editedFields: { ...r.metricFields },
        editedDate: r.date ?? new Date().toISOString().split('T')[0],
      }));
      setReviewRecords(reviews);

      // Auto-match patient name to family member
      if (result.patientName) {
        const matched = familyMembers.find(
          (m) => m.name.toLowerCase() === result.patientName!.toLowerCase()
        );
        if (matched) {
          setSelectedMemberId(matched.profileId);
        } else {
          setNewMemberName(result.patientName);
          setShowNewMemberInput(true);
          setSelectedMemberId('__new__');
        }
      }
    } catch {
      toast.error('Failed to extract data from file');
    } finally {
      setIsExtracting(false);
    }
  }, [familyMembers]);

  const handleClearFile = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setReviewRecords([]);
    setSelectedMemberId('__personal__');
    setNewMemberName('');
    setShowNewMemberInput(false);
  };

  const handleFieldChange = (recordIndex: number, field: string, value: string) => {
    setReviewRecords((prev) =>
      prev.map((r, i) =>
        i === recordIndex ? { ...r, editedFields: { ...r.editedFields, [field]: value } } : r
      )
    );
  };

  const handleDateChange = (recordIndex: number, value: string) => {
    setReviewRecords((prev) =>
      prev.map((r, i) => (i === recordIndex ? { ...r, editedDate: value } : r))
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile || reviewRecords.length === 0) return;

    let familyMemberId: string | null = null;

    if (selectedMemberId === '__new__') {
      if (!newMemberName.trim()) {
        toast.error('Please enter a name for the new family member');
        return;
      }
      if (familyMembers.length >= 8) {
        toast.error('Maximum of 8 family members reached');
        return;
      }
      try {
        const newId = await createFamilyMember.mutateAsync(newMemberName.trim());
        familyMemberId = newId;
      } catch {
        toast.error('Failed to create family member');
        return;
      }
    } else if (selectedMemberId !== '__personal__') {
      familyMemberId = selectedMemberId;
    }

    setIsSaving(true);

    try {
      // Upload file
      const arrayBuffer: ArrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await uploadFile.mutateAsync({ bytes, fileId, isTemporary: false });

      // Save each extracted record
      let savedCount = 0;
      for (const record of reviewRecords) {
        const recordType = CATEGORY_TO_RECORD_TYPE[record.category] ?? RecordType.GeneralAilments;
        const recordId = `${record.category}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const recordDate = BigInt(new Date(record.editedDate).getTime());

        await addRecord.mutateAsync({
          recordId,
          recordDate,
          recordType,
          data: JSON.stringify(record.editedFields),
          familyMemberId,
        });
        savedCount++;
      }

      const memberName =
        selectedMemberId === '__personal__'
          ? 'My Records'
          : selectedMemberId === '__new__'
          ? newMemberName.trim()
          : familyMembers.find((m) => m.profileId === selectedMemberId)?.name ?? 'Family Member';

      toast.success(`${savedCount} record${savedCount !== 1 ? 's' : ''} added to ${memberName}`);

      // Reset form
      handleClearFile();
    } catch {
      toast.error('Failed to save records');
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    reviewRecords.length > 0 &&
    (selectedMemberId !== '__new__' || newMemberName.trim().length > 0) &&
    !isSaving;

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <FileUploadZone
        onFileSelected={handleFileSelected}
        disabled={isExtracting || isSaving}
        selectedFile={selectedFile}
        onClear={handleClearFile}
      />

      {/* Extracting indicator */}
      {isExtracting && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Extracting data from report…</span>
        </div>
      )}

      {/* Extraction results */}
      {extractedData && !isExtracting && (
        <div className="space-y-4">
          {/* Patient name detection banner */}
          {extractedData.patientName && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
              <User className="h-4 w-4 text-success" />
              <span className="text-sm">
                Detected patient: <strong>{extractedData.patientName}</strong>
              </span>
            </div>
          )}

          {/* Family member selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Assign to Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={selectedMemberId}
                onValueChange={(val) => {
                  setSelectedMemberId(val);
                  setShowNewMemberInput(val === '__new__');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__personal__">My Records (Personal)</SelectItem>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.profileId} value={m.profileId}>
                      {m.name}
                    </SelectItem>
                  ))}
                  {familyMembers.length < 8 && (
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Create new profile
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {showNewMemberInput && (
                <div className="space-y-1">
                  <Label htmlFor="new-member-name">New profile name</Label>
                  <Input
                    id="new-member-name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detected records */}
          {reviewRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">
                  {reviewRecords.length} test categor{reviewRecords.length !== 1 ? 'ies' : 'y'} detected
                </span>
              </div>

              {reviewRecords.map((record, idx) => (
                <Card key={idx} className="border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <Badge variant="secondary">{record.category}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Date:</Label>
                        <Input
                          type="date"
                          value={record.editedDate}
                          onChange={(e) => handleDateChange(idx, e.target.value)}
                          className="h-7 text-xs w-36"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CategoryFieldSet
                      category={record.category as RecordType}
                      values={record.editedFields}
                      onChange={(field, value) => handleFieldChange(idx, field, value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No data detected */}
          {reviewRecords.length === 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">
                No test data could be extracted. Please enter records manually.
              </span>
            </div>
          )}

          {/* Submit */}
          {reviewRecords.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                `Save ${reviewRecords.length} Record${reviewRecords.length !== 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
