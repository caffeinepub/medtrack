import { RecordType, REFERENCE_RANGES } from '../types/medicalRecords';

export type TrendDirection = 'improving' | 'worsening' | 'stable' | 'insufficient';

export interface MetricTrend {
  key: string;
  label: string;
  unit: string;
  direction: TrendDirection;
  latestValue: number;
  firstValue: number;
  changePercent: number;
  isInRange: boolean;
  referenceMin?: number;
  referenceMax?: number;
}

export interface CategoryTrend {
  category: RecordType;
  metrics: MetricTrend[];
  dataPoints: number;
}

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: number | string;
}

function computeSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function isMetricImproving(key: string, slope: number): boolean {
  // For metrics where lower is better
  const lowerIsBetter = ['ldl', 'triglycerides', 'total', 'fasting', 'postMeal', 'hba1c', 'alt', 'ast', 'alp', 'bilirubin', 'systolic', 'diastolic'];
  if (lowerIsBetter.includes(key)) return slope < 0;
  // For metrics where higher is better
  const higherIsBetter = ['hdl', 'albumin', 'hemoglobin'];
  if (higherIsBetter.includes(key)) return slope > 0;
  // Neutral - stable is best
  return Math.abs(slope) < 0.5;
}

function getTrendDirection(key: string, values: number[]): TrendDirection {
  if (values.length < 2) return 'insufficient';
  const slope = computeSlope(values);
  const range = REFERENCE_RANGES[key];
  const threshold = range ? (range.max - range.min) * 0.03 : Math.abs(values[0]) * 0.03;

  if (Math.abs(slope) < threshold) return 'stable';
  return isMetricImproving(key, slope) ? 'improving' : 'worsening';
}

function isInRange(key: string, value: number): boolean {
  const range = REFERENCE_RANGES[key];
  if (!range) return true;
  return value >= range.min && value <= range.max;
}

export function analyzeMetricTrend(
  key: string,
  label: string,
  unit: string,
  values: number[]
): MetricTrend {
  const range = REFERENCE_RANGES[key];
  const latestValue = values[values.length - 1];
  const firstValue = values[0];
  const changePercent = firstValue !== 0 ? ((latestValue - firstValue) / Math.abs(firstValue)) * 100 : 0;

  return {
    key,
    label,
    unit,
    direction: getTrendDirection(key, values),
    latestValue,
    firstValue,
    changePercent,
    isInRange: isInRange(key, latestValue),
    referenceMin: range?.min,
    referenceMax: range?.max,
  };
}

export function buildChartData(
  records: Array<{ date: number; data: Record<string, string> }>,
  metricKeys: string[]
): ChartDataPoint[] {
  return records
    .sort((a, b) => a.date - b.date)
    .map((record) => {
      const point: ChartDataPoint = {
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        timestamp: record.date,
      };
      for (const key of metricKeys) {
        const val = parseFloat(record.data[key]);
        if (!isNaN(val)) point[key] = val;
      }
      return point;
    });
}

export const CHART_COLORS = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

export const CATEGORY_METRIC_KEYS: Record<RecordType, Array<{ key: string; label: string; unit: string }>> = {
  [RecordType.CBC]: [
    { key: 'wbc', label: 'WBC', unit: 'K/µL' },
    { key: 'rbc', label: 'RBC', unit: 'M/µL' },
    { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
    { key: 'hematocrit', label: 'Hematocrit', unit: '%' },
    { key: 'platelets', label: 'Platelets', unit: 'K/µL' },
  ],
  [RecordType.LFT]: [
    { key: 'alt', label: 'ALT', unit: 'U/L' },
    { key: 'ast', label: 'AST', unit: 'U/L' },
    { key: 'alp', label: 'ALP', unit: 'U/L' },
    { key: 'bilirubin', label: 'Bilirubin', unit: 'mg/dL' },
    { key: 'albumin', label: 'Albumin', unit: 'g/dL' },
  ],
  [RecordType.Cholesterol]: [
    { key: 'total', label: 'Total', unit: 'mg/dL' },
    { key: 'hdl', label: 'HDL', unit: 'mg/dL' },
    { key: 'ldl', label: 'LDL', unit: 'mg/dL' },
    { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL' },
  ],
  [RecordType.BloodSugar]: [
    { key: 'fasting', label: 'Fasting', unit: 'mg/dL' },
    { key: 'postMeal', label: 'Post-meal', unit: 'mg/dL' },
    { key: 'hba1c', label: 'HbA1c', unit: '%' },
  ],
  [RecordType.BloodPressure]: [
    { key: 'systolic', label: 'Systolic', unit: 'mmHg' },
    { key: 'diastolic', label: 'Diastolic', unit: 'mmHg' },
    { key: 'pulse', label: 'Pulse', unit: 'bpm' },
  ],
  [RecordType.GeneralAilments]: [],
};
