import { TimeframeType } from '@/types/config';

export interface TemporalSuggestion {
  /** Builder timeframe inferred from the advertised time extent. */
  timeframe: TimeframeType;
  /** Optional default timestamp (seconds since Unix epoch) from the service. */
  defaultTimestamp?: number;
  /** Optional raw ISO 8601 default date from the service. */
  defaultTime?: string;
}

export interface TimeDimensionInterval {
  start: string;
  end: string;
  period?: string;
}


export interface TimeDimensionExtent {
  /** ISO 8601 start date/time of the full extent. */
  start: string;
  /** ISO 8601 end date/time of the full extent. */
  end: string;
  /** Raw ISO 8601 duration period, when all intervals share one. */
  period?: string;
  /** Parsed intervals. */
  intervals: TimeDimensionInterval[];
  /** Discrete values when the dimension does not use intervals. */
  discreteValues?: string[];
  /** Builder timeframe inferred from the period or date precision. */
  suggestedTimeframe: TimeframeType;
}

export interface ParsedIso8601Duration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ISO_DURATION_REGEX = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

export function parseIso8601Duration(period: string): ParsedIso8601Duration | null {
  const match = period.match(ISO_DURATION_REGEX);
  if (!match) return null;

  const [, years, months, days, hours, minutes, seconds] = match;

  return {
    years: parseInt(years || '0', 10),
    months: parseInt(months || '0', 10),
    days: parseInt(days || '0', 10),
    hours: parseInt(hours || '0', 10),
    minutes: parseInt(minutes || '0', 10),
    seconds: parseInt(seconds || '0', 10),
  };
}

export function inferTimeframeFromDuration(period: string): TimeframeType {
  const duration = parseIso8601Duration(period);
  if (!duration) return 'Time';

  const { years, months, days, hours, minutes, seconds } = duration;

  // Any time-of-day component means the user needs sub-day precision.
  if (hours > 0 || minutes > 0 || seconds > 0) return 'Time';

  // Years dominate: choose Years even if months/days are also present.
  if (years > 0) return 'Years';
  if (months > 0) return 'Months';
  if (days > 0) return 'Days';

  return 'Time';
}

function inferTimeframeFromDatePrecision(dateStr: string): TimeframeType {
  // Full ISO string with time component
  if (/T\d{2}:\d{2}/.test(dateStr)) return 'Time';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Days';
  if (/^\d{4}-\d{2}$/.test(dateStr)) return 'Months';
  if (/^\d{4}$/.test(dateStr)) return 'Years';
  return 'Time';
}

export function parseIso8601Date(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function parseTimeDimensionValue(value: string): TimeDimensionExtent | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const entries = trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
  if (entries.length === 0) return null;

  const intervals: TimeDimensionInterval[] = [];
  const discreteValues: string[] = [];

  for (const entry of entries) {
    const parts = entry.split('/');
    if (parts.length === 3) {
      const [start, end, period] = parts;
      if (parseIso8601Date(start) && parseIso8601Date(end)) {
        intervals.push({ start, end, period });
      } else {
        discreteValues.push(entry);
      }
    } else if (parts.length === 2) {
      const [start, end] = parts;
      if (parseIso8601Date(start) && parseIso8601Date(end)) {
        intervals.push({ start, end });
      } else {
        discreteValues.push(entry);
      }
    } else {
      discreteValues.push(entry);
    }
  }

  if (intervals.length === 0 && discreteValues.length === 0) return null;

  let start: string | undefined;
  let end: string | undefined;
  let period: string | undefined;
  let suggestedTimeframe: TimeframeType | undefined;

  if (intervals.length > 0) {
    const startDates = intervals
      .map((i) => parseIso8601Date(i.start))
      .filter((d): d is Date => d !== null);
    const endDates = intervals
      .map((i) => parseIso8601Date(i.end))
      .filter((d): d is Date => d !== null);

    if (startDates.length === 0 || endDates.length === 0) return null;

    start = intervals[startDates.indexOf(new Date(Math.min(...startDates.map((d) => d.getTime()))))]?.start;
    end = intervals[endDates.indexOf(new Date(Math.max(...endDates.map((d) => d.getTime()))))]?.end;

    const periods = intervals.map((i) => i.period).filter((p): p is string => !!p);
    if (periods.length > 0) {
      const firstPeriod = periods[0];
      const allSame = periods.every((p) => p === firstPeriod);
      if (allSame) {
        period = firstPeriod;
        suggestedTimeframe = inferTimeframeFromDuration(firstPeriod);
      }
    }
  }

  if (!suggestedTimeframe) {
    if (discreteValues.length > 0) {
      suggestedTimeframe = inferTimeframeFromDatePrecision(discreteValues[0]);
    } else if (intervals.length > 0) {
      suggestedTimeframe = inferTimeframeFromDatePrecision(intervals[0].start);
    }
  }

  if (!start || !end) {
    // If we cannot derive a start/end from intervals but have discrete values,
    // treat the discrete values as the extent start/end as well.
    if (discreteValues.length > 0) {
      const dates = discreteValues
        .map((v) => parseIso8601Date(v))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());

      if (dates.length > 0) {
        start = discreteValues[0];
        end = discreteValues[discreteValues.length - 1];
      }
    }
  }

  if (!start || !end || !suggestedTimeframe) return null;

  return {
    start,
    end,
    period,
    intervals,
    discreteValues: discreteValues.length > 0 ? discreteValues : undefined,
    suggestedTimeframe,
  };
}

export function dateStringToTimestamp(dateStr: string): number | null {
  const date = parseIso8601Date(dateStr);
  if (!date) return null;
  return Math.floor(date.getTime() / 1000);
}
