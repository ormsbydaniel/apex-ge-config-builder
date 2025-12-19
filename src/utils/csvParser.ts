/**
 * CSV parsing utilities for chart data
 */

export interface ParsedCSVData {
  columns: string[];
  data: Record<string, any>[];
  error?: string;
}

/**
 * Fetch and parse CSV data from a URL
 */
export async function fetchAndParseCSV(url: string): Promise<ParsedCSVData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    return {
      columns: [],
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch CSV',
    };
  }
}

/**
 * Parse CSV text into columns and data rows
 */
export function parseCSV(text: string): ParsedCSVData {
  try {
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      return { columns: [], data: [] };
    }

    // Parse header row
    const columns = parseCSVLine(lines[0]);

    // Parse data rows
    const data: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: Record<string, any> = {};
      columns.forEach((col, index) => {
        const value = values[index] || '';
        // Try to parse as number
        const num = parseFloat(value);
        row[col] = isNaN(num) ? value : num;
      });
      data.push(row);
    }

    return { columns, data };
  } catch (error) {
    return {
      columns: [],
      data: [],
      error: error instanceof Error ? error.message : 'Failed to parse CSV',
    };
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Get columns that contain only numeric values
 */
export function getNumericColumns(data: Record<string, any>[], columns: string[]): string[] {
  return columns.filter(col => {
    // Check first few rows to determine if column is numeric
    const sampleSize = Math.min(10, data.length);
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][col];
      if (value !== undefined && value !== '' && typeof value !== 'number') {
        return false;
      }
    }
    return true;
  });
}

/**
 * Check if a string looks like a date in various formats
 */
function isDateLikeString(value: string): boolean {
  if (typeof value !== 'string') return false;
  
  // Check standard ISO format or US format (Date.parse handles these)
  if (!isNaN(Date.parse(value))) return true;
  
  // Check DD-MM-YYYY or DD/MM/YYYY format
  const ddmmyyyyPattern = /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/;
  if (ddmmyyyyPattern.test(value)) return true;
  
  // Check YYYY-MM-DD format (ISO)
  const isoPattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
  if (isoPattern.test(value)) return true;
  
  return false;
}

/**
 * Get columns that contain date-like values
 */
export function getDateColumns(data: Record<string, any>[], columns: string[]): string[] {
  return columns.filter(col => {
    const sampleSize = Math.min(5, data.length);
    let dateCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][col];
      if (isDateLikeString(value)) {
        dateCount++;
      }
    }
    
    return dateCount >= sampleSize * 0.8; // 80% must be valid dates
  });
}
