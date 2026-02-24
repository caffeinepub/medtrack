import { RecordType } from '../backend';
import type { ParsedMedicalRecord } from '../types/medicalRecords';

export interface CategorySummary {
  category: RecordType;
  count: number;
  latestDate: Date | null;
}

export function countRecordsByCategory(
  records: ParsedMedicalRecord[]
): Map<RecordType, number> {
  const counts = new Map<RecordType, number>();
  for (const record of records) {
    counts.set(record.recordType, (counts.get(record.recordType) ?? 0) + 1);
  }
  return counts;
}

export function getLatestDateByCategory(
  records: ParsedMedicalRecord[]
): Map<RecordType, Date> {
  const latestDates = new Map<RecordType, Date>();
  for (const record of records) {
    const date = new Date(Number(record.recordDate));
    const existing = latestDates.get(record.recordType);
    if (!existing || date > existing) {
      latestDates.set(record.recordType, date);
    }
  }
  return latestDates;
}

export function getCategorySummaries(
  records: ParsedMedicalRecord[]
): CategorySummary[] {
  const counts = countRecordsByCategory(records);
  const latestDates = getLatestDateByCategory(records);

  const allCategories = Object.values(RecordType);
  return allCategories
    .filter((cat) => (counts.get(cat) ?? 0) > 0)
    .map((cat) => ({
      category: cat,
      count: counts.get(cat) ?? 0,
      latestDate: latestDates.get(cat) ?? null,
    }))
    .sort((a, b) => b.count - a.count);
}
