import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { RecordType, ExternalBlob, type MedicalRecord, type UserProfile } from '../backend';
import type { ParsedMedicalRecord, RecordData } from '../types/medicalRecords';

const RECORDS_KEY = 'medicalRecords';
const USER_PROFILE_KEY = 'currentUserProfile';

function parseRecord(record: MedicalRecord): ParsedMedicalRecord {
  let data: RecordData;
  try {
    data = JSON.parse(record.data) as RecordData;
  } catch {
    data = {} as RecordData;
  }
  return {
    recordId: record.recordId,
    recordDate: record.recordDate,
    recordType: record.recordType,
    data,
  };
}

export function useGetAllRecords() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ParsedMedicalRecord[]>({
    queryKey: [RECORDS_KEY],
    queryFn: async () => {
      if (!actor) return [];
      const records = await actor.getAllRecords();
      return records.map(parseRecord).sort((a, b) => {
        return Number(b.recordDate) - Number(a.recordDate);
      });
    },
    enabled: !!actor && !isFetching && !!identity,
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
    }: {
      recordId: string;
      recordDate: bigint;
      recordType: RecordType;
      data: RecordData;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addMedicalRecord(recordId, recordDate, recordType, JSON.stringify(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
    },
  });
}

export function useDeleteMedicalRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteMedicalRecord(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: [USER_PROFILE_KEY],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_PROFILE_KEY] });
    },
  });
}

export function useUploadFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      bytes,
      fileId,
      mimeType,
    }: {
      bytes: Uint8Array<ArrayBuffer>;
      fileId: string;
      mimeType: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const blob = ExternalBlob.fromBytes(bytes);
      const returnedId = await actor.uploadFileAndGetReference(blob, fileId, true);
      return { fileId: returnedId, mimeType };
    },
  });
}

export function useDeleteUploadedFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ fileId, isTemporary }: { fileId: string; isTemporary: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteUploadedFile(fileId, isTemporary);
    },
  });
}
