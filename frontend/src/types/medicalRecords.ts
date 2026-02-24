import { RecordType } from '../backend';

export { RecordType };

export interface CBCData {
  wbc: string;
  rbc: string;
  hemoglobin: string;
  hematocrit: string;
  platelets: string;
}

export interface LFTData {
  alt: string;
  ast: string;
  alp: string;
  bilirubin: string;
  albumin: string;
}

export interface CholesterolData {
  total: string;
  hdl: string;
  ldl: string;
  triglycerides: string;
}

export interface BloodSugarData {
  fasting: string;
  postMeal: string;
  hba1c: string;
}

export interface BloodPressureData {
  systolic: string;
  diastolic: string;
  pulse: string;
}

export interface GeneralAilmentsData {
  description: string;
  severity: string;
  notes: string;
}

export type RecordData = CBCData | LFTData | CholesterolData | BloodSugarData | BloodPressureData | GeneralAilmentsData;

export interface ParsedMedicalRecord {
  recordId: string;
  recordDate: bigint;
  recordType: RecordType;
  data: RecordData;
}

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  [RecordType.CBC]: 'CBC',
  [RecordType.LFT]: 'LFT',
  [RecordType.Cholesterol]: 'Cholesterol',
  [RecordType.BloodSugar]: 'Blood Sugar',
  [RecordType.BloodPressure]: 'Blood Pressure',
  [RecordType.GeneralAilments]: 'General Ailment',
};

export const RECORD_TYPE_COLORS: Record<RecordType, string> = {
  [RecordType.CBC]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [RecordType.LFT]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [RecordType.Cholesterol]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  [RecordType.BloodSugar]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  [RecordType.BloodPressure]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  [RecordType.GeneralAilments]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

export interface ReferenceRange {
  min: number;
  max: number;
  unit: string;
  label: string;
}

export const REFERENCE_RANGES: Record<string, ReferenceRange> = {
  // CBC
  wbc: { min: 4.5, max: 11.0, unit: 'K/µL', label: 'WBC' },
  rbc: { min: 4.5, max: 5.9, unit: 'M/µL', label: 'RBC' },
  hemoglobin: { min: 13.5, max: 17.5, unit: 'g/dL', label: 'Hemoglobin' },
  hematocrit: { min: 41, max: 53, unit: '%', label: 'Hematocrit' },
  platelets: { min: 150, max: 400, unit: 'K/µL', label: 'Platelets' },
  // LFT
  alt: { min: 7, max: 56, unit: 'U/L', label: 'ALT' },
  ast: { min: 10, max: 40, unit: 'U/L', label: 'AST' },
  alp: { min: 44, max: 147, unit: 'U/L', label: 'ALP' },
  bilirubin: { min: 0.1, max: 1.2, unit: 'mg/dL', label: 'Bilirubin' },
  albumin: { min: 3.4, max: 5.4, unit: 'g/dL', label: 'Albumin' },
  // Cholesterol
  total: { min: 0, max: 200, unit: 'mg/dL', label: 'Total Cholesterol' },
  hdl: { min: 40, max: 60, unit: 'mg/dL', label: 'HDL' },
  ldl: { min: 0, max: 100, unit: 'mg/dL', label: 'LDL' },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', label: 'Triglycerides' },
  // Blood Sugar
  fasting: { min: 70, max: 100, unit: 'mg/dL', label: 'Fasting Glucose' },
  postMeal: { min: 0, max: 140, unit: 'mg/dL', label: 'Post-meal Glucose' },
  hba1c: { min: 0, max: 5.7, unit: '%', label: 'HbA1c' },
  // Blood Pressure
  systolic: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic' },
  diastolic: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic' },
  pulse: { min: 60, max: 100, unit: 'bpm', label: 'Pulse' },
};

export const CBC_FIELDS: Array<{ key: keyof CBCData; label: string; unit: string; placeholder: string }> = [
  { key: 'wbc', label: 'WBC', unit: 'K/µL', placeholder: '4.5–11.0' },
  { key: 'rbc', label: 'RBC', unit: 'M/µL', placeholder: '4.5–5.9' },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', placeholder: '13.5–17.5' },
  { key: 'hematocrit', label: 'Hematocrit', unit: '%', placeholder: '41–53' },
  { key: 'platelets', label: 'Platelets', unit: 'K/µL', placeholder: '150–400' },
];

export const LFT_FIELDS: Array<{ key: keyof LFTData; label: string; unit: string; placeholder: string }> = [
  { key: 'alt', label: 'ALT', unit: 'U/L', placeholder: '7–56' },
  { key: 'ast', label: 'AST', unit: 'U/L', placeholder: '10–40' },
  { key: 'alp', label: 'ALP', unit: 'U/L', placeholder: '44–147' },
  { key: 'bilirubin', label: 'Bilirubin', unit: 'mg/dL', placeholder: '0.1–1.2' },
  { key: 'albumin', label: 'Albumin', unit: 'g/dL', placeholder: '3.4–5.4' },
];

export const CHOLESTEROL_FIELDS: Array<{ key: keyof CholesterolData; label: string; unit: string; placeholder: string }> = [
  { key: 'total', label: 'Total Cholesterol', unit: 'mg/dL', placeholder: '<200' },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL', placeholder: '40–60' },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL', placeholder: '<100' },
  { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', placeholder: '<150' },
];

export const BLOOD_SUGAR_FIELDS: Array<{ key: keyof BloodSugarData; label: string; unit: string; placeholder: string }> = [
  { key: 'fasting', label: 'Fasting Glucose', unit: 'mg/dL', placeholder: '70–100' },
  { key: 'postMeal', label: 'Post-meal Glucose', unit: 'mg/dL', placeholder: '<140' },
  { key: 'hba1c', label: 'HbA1c', unit: '%', placeholder: '<5.7' },
];

export const BLOOD_PRESSURE_FIELDS: Array<{ key: keyof BloodPressureData; label: string; unit: string; placeholder: string }> = [
  { key: 'systolic', label: 'Systolic', unit: 'mmHg', placeholder: '90–120' },
  { key: 'diastolic', label: 'Diastolic', unit: 'mmHg', placeholder: '60–80' },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', placeholder: '60–100' },
];
