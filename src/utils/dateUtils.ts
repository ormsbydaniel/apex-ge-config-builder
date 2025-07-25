import { format } from 'date-fns';
import { TimeframeType } from '@/types/config';

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
      return format(date, 'PP'); // e.g., "Dec 21, 2024"
    case 'None':
    default:
      return format(date, 'PPpp'); // Full date and time
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
    case 'None':
    default:
      return dateToTimestamp(date);
  }
}