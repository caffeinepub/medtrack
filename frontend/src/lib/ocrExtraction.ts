import type { ExtractedRecordData, ExtractedTestPair } from '../types/fileUpload';

// ─── Date extraction ──────────────────────────────────────────────────────────

const DATE_PATTERNS = [
  // ISO: 2024-03-15
  /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
  // US: 03/15/2024 or 03-15-2024
  /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/g,
  // Long: March 15, 2024 or 15 March 2024
  /\b(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})\b/gi,
  /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b/gi,
];

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const raw = match[1];
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
  }
  return null;
}

// ─── Medical test patterns ────────────────────────────────────────────────────

interface TestPattern {
  names: string[];
  key: string;
  category: string;
}

const TEST_PATTERNS: TestPattern[] = [
  // CBC
  { names: ['WBC', 'White Blood Cell', 'White Blood Count', 'Leukocytes'], key: 'wbc', category: 'CBC' },
  { names: ['RBC', 'Red Blood Cell', 'Red Blood Count', 'Erythrocytes'], key: 'rbc', category: 'CBC' },
  { names: ['Hemoglobin', 'Hgb', 'Hb'], key: 'hemoglobin', category: 'CBC' },
  { names: ['Hematocrit', 'Hct', 'PCV'], key: 'hematocrit', category: 'CBC' },
  { names: ['Platelets', 'PLT', 'Thrombocytes', 'Platelet Count'], key: 'platelets', category: 'CBC' },
  // LFT
  { names: ['ALT', 'SGPT', 'Alanine Aminotransferase', 'Alanine Transaminase'], key: 'alt', category: 'LFT' },
  { names: ['AST', 'SGOT', 'Aspartate Aminotransferase', 'Aspartate Transaminase'], key: 'ast', category: 'LFT' },
  { names: ['ALP', 'Alkaline Phosphatase'], key: 'alp', category: 'LFT' },
  { names: ['Bilirubin', 'Total Bilirubin', 'T. Bilirubin', 'T.Bilirubin'], key: 'bilirubin', category: 'LFT' },
  { names: ['Albumin', 'Serum Albumin'], key: 'albumin', category: 'LFT' },
  // Cholesterol
  { names: ['Total Cholesterol', 'Cholesterol Total', 'Cholesterol'], key: 'total', category: 'Cholesterol' },
  { names: ['HDL', 'HDL Cholesterol', 'HDL-C', 'High Density Lipoprotein'], key: 'hdl', category: 'Cholesterol' },
  { names: ['LDL', 'LDL Cholesterol', 'LDL-C', 'Low Density Lipoprotein'], key: 'ldl', category: 'Cholesterol' },
  { names: ['Triglycerides', 'TG', 'Triglyceride', 'TRIG'], key: 'triglycerides', category: 'Cholesterol' },
  // Blood Sugar
  { names: ['Fasting Glucose', 'Fasting Blood Sugar', 'FBS', 'FBG', 'Fasting Blood Glucose'], key: 'fasting', category: 'BloodSugar' },
  { names: ['Post Meal', 'Post-meal', 'Postprandial', 'PP Glucose', 'PPBS', '2hr PP', '2-hour PP'], key: 'postMeal', category: 'BloodSugar' },
  { names: ['HbA1c', 'Hba1c', 'A1C', 'Glycated Hemoglobin', 'Glycosylated Hemoglobin'], key: 'hba1c', category: 'BloodSugar' },
  // Blood Pressure
  { names: ['Systolic', 'SBP', 'Systolic BP', 'Systolic Blood Pressure'], key: 'systolic', category: 'BloodPressure' },
  { names: ['Diastolic', 'DBP', 'Diastolic BP', 'Diastolic Blood Pressure'], key: 'diastolic', category: 'BloodPressure' },
  { names: ['Pulse', 'Heart Rate', 'HR', 'Pulse Rate'], key: 'pulse', category: 'BloodPressure' },
];

// Matches a test name followed by a numeric value (with optional units)
function buildTestRegex(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // e.g. "WBC : 5.2 K/µL" or "WBC 5.2" or "WBC=5.2"
  return new RegExp(
    `${escaped}\\s*[:\\-=]?\\s*(\\d+\\.?\\d*)`,
    'i'
  );
}

function extractTestValues(text: string): { pairs: ExtractedTestPair[]; categoryCounts: Record<string, number> } {
  const pairs: ExtractedTestPair[] = [];
  const categoryCounts: Record<string, number> = {};
  const foundKeys = new Set<string>();

  for (const testPattern of TEST_PATTERNS) {
    if (foundKeys.has(testPattern.key)) continue;

    for (const name of testPattern.names) {
      const regex = buildTestRegex(name);
      const match = regex.exec(text);
      if (match) {
        const value = match[1];
        pairs.push({ testName: testPattern.key, value });
        foundKeys.add(testPattern.key);
        categoryCounts[testPattern.category] = (categoryCounts[testPattern.category] || 0) + 1;
        break;
      }
    }
  }

  // Also try to detect blood pressure in "120/80" format
  if (!foundKeys.has('systolic') && !foundKeys.has('diastolic')) {
    const bpMatch = /\b(\d{2,3})\s*\/\s*(\d{2,3})\b/.exec(text);
    if (bpMatch) {
      pairs.push({ testName: 'systolic', value: bpMatch[1] });
      pairs.push({ testName: 'diastolic', value: bpMatch[2] });
      categoryCounts['BloodPressure'] = (categoryCounts['BloodPressure'] || 0) + 2;
    }
  }

  return { pairs, categoryCounts };
}

function suggestCategory(categoryCounts: Record<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }
  return best;
}

// ─── PDF text extraction (text-based PDFs only) ───────────────────────────────

async function extractTextFromPDF(bytes: Uint8Array): Promise<string> {
  // Simple heuristic: scan for readable ASCII text in the PDF byte stream
  // This works for text-based PDFs (not scanned images)
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);

  // Extract text between BT (begin text) and ET (end text) markers
  const textChunks: string[] = [];

  // Match parenthesized strings (PDF text objects)
  const parenRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = parenRegex.exec(raw)) !== null) {
    const chunk = m[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      // Remove non-printable chars
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    if (chunk.trim().length > 1) {
      textChunks.push(chunk);
    }
  }

  // Also try to extract hex strings <...>
  const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
  while ((m = hexRegex.exec(raw)) !== null) {
    const hex = m[1].replace(/\s/g, '');
    if (hex.length % 2 === 0 && hex.length > 2) {
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.slice(i, i + 2), 16);
        if (code >= 32 && code <= 126) decoded += String.fromCharCode(code);
        else if (code === 10 || code === 13) decoded += '\n';
        else decoded += ' ';
      }
      if (decoded.trim().length > 1) textChunks.push(decoded);
    }
  }

  return textChunks.join(' ');
}

// ─── Image text extraction (canvas-based, very basic) ────────────────────────

async function extractTextFromImage(bytes: Uint8Array, mimeType: string): Promise<string> {
  // We can't do real OCR in the browser without a library.
  // Return a placeholder that signals the user to verify manually.
  // The raw bytes are uploaded; we do our best with pattern matching on any
  // embedded metadata or EXIF text.
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);

  // Try to find any ASCII text segments in the image binary
  const asciiRegex = /[ -~]{4,}/g;
  const chunks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = asciiRegex.exec(raw)) !== null) {
    const chunk = m[0].trim();
    if (chunk.length >= 4) chunks.push(chunk);
  }

  return chunks.join(' ');
}

// ─── Main extraction entry point ─────────────────────────────────────────────

export async function extractRecordData(
  bytes: Uint8Array,
  mimeType: string
): Promise<ExtractedRecordData> {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    rawText = await extractTextFromPDF(bytes);
  } else {
    rawText = await extractTextFromImage(bytes, mimeType);
  }

  const detectedDate = extractDate(rawText);
  const { pairs, categoryCounts } = extractTestValues(rawText);
  const suggestedCategory = suggestCategory(categoryCounts);

  return {
    detectedDate,
    testNameValuePairs: pairs,
    rawExtractedText: rawText.slice(0, 4000), // cap for display
    suggestedCategory,
  };
}
