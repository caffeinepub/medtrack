import type { ExtractedTestData, ExtractedRecordEntry } from '../types/fileUpload';

// ── helpers ──────────────────────────────────────────────────────────────────

function extractText(bytes: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(bytes);
  } catch {
    return '';
  }
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function toISO(day: number, month: number, year: number): string | null {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseRawDate(raw: string): string | null {
  raw = raw.trim();

  // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    return toISO(parseInt(isoMatch[3]), parseInt(isoMatch[2]), parseInt(isoMatch[1]));
  }

  // DD MMM YYYY or DD MMMM YYYY (e.g., "12 Jan 2024", "12 January 2024")
  const dMonthY = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dMonthY) {
    const month = MONTH_MAP[dMonthY[2].toLowerCase()];
    if (month) return toISO(parseInt(dMonthY[1]), month, parseInt(dMonthY[3]));
  }

  // MMM DD, YYYY or MMM DD YYYY (e.g., "Jan 12, 2024", "January 12 2024")
  const monthDY = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDY) {
    const month = MONTH_MAP[monthDY[1].toLowerCase()];
    if (month) return toISO(parseInt(monthDY[2]), month, parseInt(monthDY[3]));
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1]);
    const m = parseInt(dmyMatch[2]);
    const y = parseInt(dmyMatch[3]);
    // Try DD/MM/YYYY first (most common in medical reports outside US)
    const ddmm = toISO(d, m, y);
    if (ddmm) return ddmm;
    // Fallback: MM/DD/YYYY
    return toISO(m, d, y);
  }

  return null;
}

export function extractDate(text: string): string | null {
  const DATE_LABEL = /(?:date\s*of\s*report|report\s*date|collection\s*date|sample\s*date|test\s*date|date)\s*[:\-]\s*/i;

  // Labeled patterns — try these first for higher confidence
  const labeledPatterns: RegExp[] = [
    new RegExp(DATE_LABEL.source + '(\\d{4}[\\\/\\-\\.]\\d{1,2}[\\\/\\-\\.]\\d{1,2})', 'i'),
    new RegExp(DATE_LABEL.source + '(\\d{1,2}[\\\/\\-\\.]\\d{1,2}[\\\/\\-\\.]\\d{2,4})', 'i'),
    new RegExp(DATE_LABEL.source + '(\\d{1,2}\\s+[A-Za-z]+\\s+\\d{4})', 'i'),
    new RegExp(DATE_LABEL.source + '([A-Za-z]+\\s+\\d{1,2},?\\s+\\d{4})', 'i'),
  ];

  for (const pattern of labeledPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseRawDate(match[1]);
      if (parsed) return parsed;
    }
  }

  // Unlabeled patterns — scan the whole text
  const unlabeledPatterns: RegExp[] = [
    /\b(\d{4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2})\b/,
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/i,
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/,
  ];

  for (const pattern of unlabeledPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseRawDate(match[1]);
      if (parsed) return parsed;
    }
  }

  return null;
}

export function extractPatientName(text: string): string | null {
  const patterns = [
    /patient\s*name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,50})/i,
    /patient\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,50})/i,
    /name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,50})/i,
    /mr\.?\s+([A-Za-z][A-Za-z\s\.\-]{1,50})/i,
    /mrs\.?\s+([A-Za-z][A-Za-z\s\.\-]{1,50})/i,
    /ms\.?\s+([A-Za-z][A-Za-z\s\.\-]{1,50})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      const lower = name.toLowerCase();
      if (
        lower.includes('report') ||
        lower.includes('date') ||
        lower.includes('test') ||
        lower.includes('result') ||
        lower.includes('lab') ||
        name.length < 2
      ) {
        continue;
      }
      return name;
    }
  }
  return null;
}

// ── CBC ───────────────────────────────────────────────────────────────────────

function extractCBC(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};

  const patterns: Record<string, RegExp[]> = {
    hemoglobin: [/h(?:a?e)?moglobin[^0-9]*([0-9]+\.?[0-9]*)/i, /hb[^0-9]*([0-9]+\.?[0-9]*)/i],
    wbc: [/w(?:hite)?\s*b(?:lood)?\s*c(?:ell|ount)?[^0-9]*([0-9]+\.?[0-9]*)/i, /wbc[^0-9]*([0-9]+\.?[0-9]*)/i, /leukocytes?[^0-9]*([0-9]+\.?[0-9]*)/i],
    rbc: [/r(?:ed)?\s*b(?:lood)?\s*c(?:ell|ount)?[^0-9]*([0-9]+\.?[0-9]*)/i, /rbc[^0-9]*([0-9]+\.?[0-9]*)/i],
    platelets: [/platelet[^0-9]*([0-9]+\.?[0-9]*)/i, /plt[^0-9]*([0-9]+\.?[0-9]*)/i, /thrombocytes?[^0-9]*([0-9]+\.?[0-9]*)/i],
    hematocrit: [/h(?:a?e)?matocrit[^0-9]*([0-9]+\.?[0-9]*)/i, /hct[^0-9]*([0-9]+\.?[0-9]*)/i, /pcv[^0-9]*([0-9]+\.?[0-9]*)/i],
    mcv: [/mcv[^0-9]*([0-9]+\.?[0-9]*)/i, /mean\s*corp(?:uscular)?\s*vol[^0-9]*([0-9]+\.?[0-9]*)/i],
    mch: [/\bmch\b[^0-9]*([0-9]+\.?[0-9]*)/i],
    mchc: [/mchc[^0-9]*([0-9]+\.?[0-9]*)/i],
    neutrophils: [/neutrophil[^0-9]*([0-9]+\.?[0-9]*)/i],
    lymphocytes: [/lymphocyte[^0-9]*([0-9]+\.?[0-9]*)/i],
    monocytes: [/monocyte[^0-9]*([0-9]+\.?[0-9]*)/i],
    eosinophils: [/eosinophil[^0-9]*([0-9]+\.?[0-9]*)/i],
    basophils: [/basophil[^0-9]*([0-9]+\.?[0-9]*)/i],
  };

  let found = 0;
  for (const [key, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match) {
        fields[key] = match[1];
        found++;
        break;
      }
    }
  }

  return found >= 2 ? fields : null;
}

// ── LFT ───────────────────────────────────────────────────────────────────────

function extractLFT(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};

  const patterns: Record<string, RegExp[]> = {
    alt: [/\balt\b[^0-9]*([0-9]+\.?[0-9]*)/i, /alanine\s*(?:amino)?transf[^0-9]*([0-9]+\.?[0-9]*)/i, /sgpt[^0-9]*([0-9]+\.?[0-9]*)/i],
    ast: [/\bast\b[^0-9]*([0-9]+\.?[0-9]*)/i, /aspartate\s*(?:amino)?transf[^0-9]*([0-9]+\.?[0-9]*)/i, /sgot[^0-9]*([0-9]+\.?[0-9]*)/i],
    alp: [/\balp\b[^0-9]*([0-9]+\.?[0-9]*)/i, /alkaline\s*phosphatase[^0-9]*([0-9]+\.?[0-9]*)/i],
    bilirubin: [/(?:total\s*)?bilirubin[^0-9]*([0-9]+\.?[0-9]*)/i],
    albumin: [/albumin[^0-9]*([0-9]+\.?[0-9]*)/i],
    totalProtein: [/total\s*protein[^0-9]*([0-9]+\.?[0-9]*)/i],
    ggt: [/\bggt\b[^0-9]*([0-9]+\.?[0-9]*)/i, /gamma\s*(?:glutamyl)?[^0-9]*([0-9]+\.?[0-9]*)/i],
  };

  let found = 0;
  for (const [key, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match) {
        fields[key] = match[1];
        found++;
        break;
      }
    }
  }

  return found >= 2 ? fields : null;
}

// ── Cholesterol ───────────────────────────────────────────────────────────────

function extractCholesterol(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};

  const patterns: Record<string, RegExp[]> = {
    totalCholesterol: [/total\s*cholesterol[^0-9]*([0-9]+\.?[0-9]*)/i, /cholesterol[^0-9]*([0-9]+\.?[0-9]*)/i],
    ldl: [/\bldl\b[^0-9]*([0-9]+\.?[0-9]*)/i, /low\s*density[^0-9]*([0-9]+\.?[0-9]*)/i],
    hdl: [/\bhdl\b[^0-9]*([0-9]+\.?[0-9]*)/i, /high\s*density[^0-9]*([0-9]+\.?[0-9]*)/i],
    triglycerides: [/triglyceride[^0-9]*([0-9]+\.?[0-9]*)/i, /tg[^0-9]*([0-9]+\.?[0-9]*)/i],
    vldl: [/\bvldl\b[^0-9]*([0-9]+\.?[0-9]*)/i],
  };

  let found = 0;
  for (const [key, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match) {
        fields[key] = match[1];
        found++;
        break;
      }
    }
  }

  return found >= 2 ? fields : null;
}

// ── Blood Sugar ───────────────────────────────────────────────────────────────

function extractBloodSugar(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};

  const patterns: Record<string, RegExp[]> = {
    fastingGlucose: [/fasting\s*(?:blood\s*)?(?:glucose|sugar)[^0-9]*([0-9]+\.?[0-9]*)/i, /fbg[^0-9]*([0-9]+\.?[0-9]*)/i, /fbs[^0-9]*([0-9]+\.?[0-9]*)/i],
    postprandialGlucose: [/post\s*(?:prandial|meal)[^0-9]*([0-9]+\.?[0-9]*)/i, /pp\s*(?:blood\s*)?(?:glucose|sugar)[^0-9]*([0-9]+\.?[0-9]*)/i, /ppbs[^0-9]*([0-9]+\.?[0-9]*)/i],
    hba1c: [/hba1c[^0-9]*([0-9]+\.?[0-9]*)/i, /glycated\s*h(?:a?e)?moglobin[^0-9]*([0-9]+\.?[0-9]*)/i, /a1c[^0-9]*([0-9]+\.?[0-9]*)/i],
    randomGlucose: [/random\s*(?:blood\s*)?(?:glucose|sugar)[^0-9]*([0-9]+\.?[0-9]*)/i, /rbs[^0-9]*([0-9]+\.?[0-9]*)/i],
  };

  let found = 0;
  for (const [key, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match) {
        fields[key] = match[1];
        found++;
        break;
      }
    }
  }

  if (found === 0) {
    const glucoseMatch = text.match(/glucose[^0-9]*([0-9]+\.?[0-9]*)/i);
    if (glucoseMatch) {
      fields['fastingGlucose'] = glucoseMatch[1];
      found++;
    }
  }

  return found >= 1 ? fields : null;
}

// ── Blood Pressure ────────────────────────────────────────────────────────────

function extractBloodPressure(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};

  const bpPattern = text.match(/(?:bp|blood\s*pressure)[^0-9]*([0-9]+)\s*[\/\-]\s*([0-9]+)/i);
  if (bpPattern) {
    fields['systolic'] = bpPattern[1];
    fields['diastolic'] = bpPattern[2];
  }

  const systolicMatch = text.match(/systolic[^0-9]*([0-9]+)/i);
  if (systolicMatch) fields['systolic'] = systolicMatch[1];

  const diastolicMatch = text.match(/diastolic[^0-9]*([0-9]+)/i);
  if (diastolicMatch) fields['diastolic'] = diastolicMatch[1];

  const pulseMatch = text.match(/(?:pulse|heart\s*rate)[^0-9]*([0-9]+)/i);
  if (pulseMatch) fields['pulse'] = pulseMatch[1];

  return Object.keys(fields).length >= 1 ? fields : null;
}

// ── Main extraction ───────────────────────────────────────────────────────────

export function extractFromText(text: string): ExtractedTestData {
  const patientName = extractPatientName(text);
  const date = extractDate(text);
  const records: ExtractedRecordEntry[] = [];

  const cbcFields = extractCBC(text);
  if (cbcFields && Object.keys(cbcFields).length > 0) {
    records.push({ category: 'CBC', metricFields: cbcFields, date });
  }

  const lftFields = extractLFT(text);
  if (lftFields && Object.keys(lftFields).length > 0) {
    records.push({ category: 'LFT', metricFields: lftFields, date });
  }

  const cholFields = extractCholesterol(text);
  if (cholFields && Object.keys(cholFields).length > 0) {
    records.push({ category: 'Cholesterol', metricFields: cholFields, date });
  }

  const bsFields = extractBloodSugar(text);
  if (bsFields && Object.keys(bsFields).length > 0) {
    records.push({ category: 'BloodSugar', metricFields: bsFields, date });
  }

  const bpFields = extractBloodPressure(text);
  if (bpFields && Object.keys(bpFields).length > 0) {
    records.push({ category: 'BloodPressure', metricFields: bpFields, date });
  }

  if (records.length === 0) {
    records.push({
      category: 'GeneralAilments',
      metricFields: { notes: text.slice(0, 500) },
      date,
    });
  }

  return { patientName, records, rawExtractedText: text };
}

export async function extractFromFile(bytes: Uint8Array): Promise<ExtractedTestData> {
  const text = extractText(bytes);
  return extractFromText(text);
}

// Alias for FileUploadWithExtraction component
export async function extractMedicalData(bytes: Uint8Array, _mimeType: string): Promise<ExtractedTestData> {
  return extractFromFile(bytes);
}
