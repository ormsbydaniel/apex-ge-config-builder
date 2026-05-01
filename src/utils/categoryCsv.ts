/**
 * CSV import/export for legend categories.
 *
 * Expected format (header row required, columns may appear in any order):
 *
 *   label,color,value
 *   Forest,#2E7D32,1
 *   Water,#1565C0,2
 *   "Mixed, urban",#9E9E9E,3
 *
 * The `value` column is optional. When omitted, the imported set is treated
 * as "no values" (useValues=false). When present, every row must supply a
 * valid integer value.
 */
import { Category } from '@/types/config';

export interface CategoryCsvParseError {
  row: number; // 1-based row number in the source file (header = row 1)
  message: string;
}

export interface CategoryCsvParseResult {
  categories: Category[];
  useValues: boolean;
  errors: CategoryCsvParseError[];
}

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

const escapeCsvField = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const categoriesToCsv = (categories: Category[], useValues: boolean): string => {
  const header = useValues ? 'label,color,value' : 'label,color';
  const rows = categories.map(cat => {
    const label = escapeCsvField(cat.label ?? '');
    const color = escapeCsvField(cat.color ?? '');
    if (useValues) {
      return `${label},${color},${cat.value ?? ''}`;
    }
    return `${label},${color}`;
  });
  return [header, ...rows].join('\n') + '\n';
};

/**
 * Minimal CSV line parser supporting quoted fields with embedded commas,
 * doubled-quote escaping, and trimmed whitespace around unquoted fields.
 */
const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"' && current.length === 0) {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
};

const splitLines = (text: string): string[] =>
  text.replace(/\r\n?/g, '\n').split('\n').filter(line => line.length > 0);

export const parseCategoriesCsv = (text: string): CategoryCsvParseResult => {
  const errors: CategoryCsvParseError[] = [];
  const lines = splitLines(text);

  if (lines.length === 0) {
    return { categories: [], useValues: false, errors: [{ row: 1, message: 'File is empty' }] };
  }

  const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const labelIdx = header.indexOf('label');
  const colorIdx = header.indexOf('color');
  const valueIdx = header.indexOf('value');

  if (labelIdx === -1 || colorIdx === -1) {
    return {
      categories: [],
      useValues: false,
      errors: [{ row: 1, message: 'Header must include at least "label" and "color" columns' }],
    };
  }

  const useValues = valueIdx !== -1;
  const categories: Category[] = [];
  const seenValues = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const fields = parseCsvLine(lines[i]);
    const label = fields[labelIdx]?.trim() ?? '';
    const color = fields[colorIdx]?.trim() ?? '';

    if (!label) {
      errors.push({ row: rowNum, message: 'Missing label' });
      continue;
    }
    if (!HEX_RE.test(color)) {
      errors.push({ row: rowNum, message: `Invalid hex color "${color}"` });
      continue;
    }

    let value: number;
    if (useValues) {
      const raw = fields[valueIdx]?.trim() ?? '';
      const parsed = Number(raw);
      if (raw === '' || !Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        errors.push({ row: rowNum, message: `Invalid integer value "${raw}"` });
        continue;
      }
      if (seenValues.has(parsed)) {
        errors.push({ row: rowNum, message: `Duplicate value ${parsed}` });
        continue;
      }
      seenValues.add(parsed);
      value = parsed;
    } else {
      value = categories.length;
    }

    categories.push({ label, color, value });
  }

  return { categories, useValues, errors };
};

export const downloadCategoriesCsv = (
  categories: Category[],
  useValues: boolean,
  filename: string,
): void => {
  const csv = categoriesToCsv(categories, useValues);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
