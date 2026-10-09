import { format } from 'date-fns';
import { TimeframeType } from '@/types/config';

/** Standard UK display formats used across the app (DD/MM/YYYY). */
export const DISPLAY_DATE_FORMAT = 'dd/MM/yyyy';
export const DISPLAY_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

/** Format a Date/ISO string/ms value as DD/MM/YYYY (or with time). */
export function formatDisplayDate(value: Date | string | number | undefined | null, withTime = false): string {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return format(date, withTime ? DISPLAY_DATETIME_FORMAT : DISPLAY_DATE_FORMAT);
}

/** date-fns display pattern for a timeframe (DD/MM/YYYY standard). */
export function getTimeframeDisplayFormat(timeframe: TimeframeType | string | undefined): string {
  switch (timeframe) {
    case 'Years': return 'yyyy';
    case 'Months': return 'MMMM yyyy';
    case 'Time': return DISPLAY_DATETIME_FORMAT;
    default: return DISPLAY_DATE_FORMAT;
  }
}

/**
 * Format a timestamp for display based on the timeframe type
 */
export function formatTimestampForTimeframe(timestamp: number, timeframe: TimeframeType): string {
  const date = new Date(timestamp * 1000); // Convert Unix timestamp to Date
  
  switch (timeframe) {
    case 'Years':
      return format(date, 'yyyy');
    case 'Months':
      return format(date, 'MMMM yyyy');
    case 'Days':
      return format(date, DISPLAY_DATE_FORMAT);
    case 'Time':
      return format(date, DISPLAY_DATETIME_FORMAT);
    case 'None':
    default:
      return format(date, DISPLAY_DATETIME_FORMAT);
  }
}

/**
 * Get the current timestamp as Unix timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert a Date object to Unix timestamp
 */
export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert Unix timestamp to Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Get a representative timestamp for a given timeframe
 * This creates a timestamp that represents the beginning of the period
 */
export function getRepresentativeTimestamp(date: Date, timeframe: TimeframeType): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  switch (timeframe) {
    case 'Years':
      // Beginning of the year
      return dateToTimestamp(new Date(year, 0, 1));
    case 'Months':
      // Beginning of the month
      return dateToTimestamp(new Date(year, month, 1));
    case 'Days':
      // Beginning of the day
      return dateToTimestamp(new Date(year, month, day));
    case 'Time':
      // Exact timestamp - no truncation
      return dateToTimestamp(date);
    case 'None':
    default:
      return dateToTimestamp(date);
  }
}