import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { RecordType, ExternalBlob, type MedicalRecord, type UserProfile, type FamilyMemberProfile } from '../backend';

// ParsedMedicalRecord keeps recordDate as bigint to stay compatible with
// existing utilities (recordSummary, trendAnalysis) that expect bigint / number.
export interface ParsedMedicalRecord {
  recordId: string;
  recordDate: bigint;
  recordType: RecordType;
  data: string;
}

function parseRecord(record: MedicalRecord): ParsedMedicalRecord {
  return {
    recordId: record.recordId,
    recordDate: record.recordDate,
    recordType: record.recordType,
    data: record.data,
  };
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Family Members ────────────────────────────────────────────────────────────

export function useListFamilyMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<FamilyMemberProfile[]>({
    queryKey: ['familyMembers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFamilyMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateFamilyMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createFamilyMember(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
    },
  });
}

export function useDeleteFamilyMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteFamilyMember(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

// ── Medical Records ───────────────────────────────────────────────────────────

export function useGetAllRecords(familyMemberId?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ParsedMedicalRecord[]>({
    queryKey: ['records', familyMemberId ?? null],
    queryFn: async () => {
      if (!actor) return [];
      const records = await actor.getAllRecords(familyMemberId ?? null);
      return records.map(parseRecord);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMedicalRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recordId,
      recordDate,
      recordType,
      data,
      familyMemberId,
    }: {
      recordId: string;
      recordDate: bigint;
      recordType: RecordType;
      data: string;
      familyMemberId?: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMedicalRecord(recordId, recordDate, recordType, data, familyMemberId ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

export function useDeleteMedicalRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, familyMemberId }: { recordId: string; familyMemberId?: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMedicalRecord(recordId, familyMemberId ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

// ── File Records (PDF/Image uploads) ─────────────────────────────────────────

export type FileRecord = {
  fileId: string;
  blob: ExternalBlob;
  fileName: string;
  mimeType: string;
  uploadTimestamp: number;
  patientName?: string;
  recordDate?: string;
};

function parseFileId(fileId: string): {
  fileName: string;
  mimeType: string;
  uploadTimestamp: number;
  patientName?: string;
  recordDate?: string;
} {
  // fileId format: "timestamp__fileName__patientName__recordDate"
  try {
    const parts = fileId.split('__');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[0], 10);
      const fileName = parts[1];
      const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
      const mimeType =
        ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg';
      const patientName =
        parts[2] && parts[2] !== 'undefined' && parts[2] !== '' ? parts[2] : undefined;
      const recordDate =
        parts[3] && parts[3] !== 'undefined' && parts[3] !== '' ? parts[3] : undefined;
      return {
        fileName,
        mimeType,
        uploadTimestamp: isNaN(timestamp) ? Date.now() : timestamp,
        patientName,
        recordDate,
      };
    }
  } catch {
    // fallback
  }
  const ext = fileId.split('.').pop()?.toLowerCase() ?? '';
  const mimeType =
    ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg';
  return { fileName: fileId, mimeType, uploadTimestamp: Date.now() };
}

export function useListUserFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<FileRecord[]>({
    queryKey: ['userFiles'],
    queryFn: async () => {
      if (!actor) return [];
      const files = await actor.listUserFiles();
      return files.map(([fileId, blob]) => ({
        fileId,
        blob,
        ...parseFileId(fileId),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRecordDetails(recordId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['recordDetails', recordId],
    queryFn: async () => {
      if (!actor || !recordId) return null;
      return actor.getRecordDetails(recordId);
    },
    enabled: !!actor && !isFetching && !!recordId,
  });
}

export function useUploadFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileBytes,
      fileName,
      mimeType,
      patientName,
      recordDate,
      onProgress,
    }: {
      fileBytes: Uint8Array;
      fileName: string;
      mimeType: string;
      patientName?: string;
      recordDate?: string;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const timestamp = Date.now();
      const fileId = `${timestamp}__${fileName}__${patientName ?? ''}__${recordDate ?? ''}`;
      // Cast to the exact type ExternalBlob.fromBytes expects
      let blob = ExternalBlob.fromBytes(fileBytes as Uint8Array<ArrayBuffer>);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.uploadFileAndGetReference(blob, fileId, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFiles'] });
    },
  });
}

export function useDeleteUploadedFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, isTemporary }: { fileId: string; isTemporary: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUploadedFile(fileId, isTemporary);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFiles'] });
    },
  });
}
