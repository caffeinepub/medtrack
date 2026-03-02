import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MedicalRecord {
    data: string;
    recordDate: bigint;
    recordType: RecordType;
    recordId: string;
}
export interface FamilyMemberProfile {
    name: string;
    profileId: string;
}
export interface UserProfile {
    name: string;
}
export enum RecordType {
    CBC = "CBC",
    LFT = "LFT",
    GeneralAilments = "GeneralAilments",
    BloodSugar = "BloodSugar",
    BloodPressure = "BloodPressure",
    Cholesterol = "Cholesterol"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMedicalRecord(recordId: string, recordDate: bigint, recordType: RecordType, data: string, familyMemberId: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFamilyMember(name: string): Promise<string>;
    deleteFamilyMember(profileId: string): Promise<void>;
    deleteMedicalRecord(recordId: string, familyMemberId: string | null): Promise<void>;
    deleteRecord(recordId: string): Promise<void>;
    deleteUploadedFile(fileId: string, isTemporary: boolean): Promise<void>;
    getAllRecords(familyMemberId: string | null): Promise<Array<MedicalRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMedicalRecord(recordId: string, familyMemberId: string | null): Promise<MedicalRecord>;
    getRecordDetails(recordId: string): Promise<ExternalBlob | null>;
    getRecordsByType(recordType: RecordType, familyMemberId: string | null): Promise<Array<MedicalRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRecords(): Promise<Array<[string, ExternalBlob]>>;
    hasMedicalRecordAccess(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listFamilyMembers(): Promise<Array<FamilyMemberProfile>>;
    listUploadedFiles(): Promise<Array<[string, ExternalBlob]>>;
    listUserFiles(): Promise<Array<[string, ExternalBlob]>>;
    recordExists(recordId: string, familyMemberId: string | null): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadFileAndGetReference(blob: ExternalBlob, fileId: string, isTemporary: boolean): Promise<string>;
}
