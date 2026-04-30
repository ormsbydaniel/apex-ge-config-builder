/**
 * Helpers to derive the two healthcheck grid columns
 * (Data Access + Performance) from a LayerValidationResult.
 *
 * Reachability and performance are surfaced as independent signals
 * so the user can see at a glance whether a layer "works" and
 * whether it works "well".
 */

import { LayerValidationResult } from '@/types/config';

export type DataAccessStatus = 'pass' | 'partial' | 'fail' | 'na';
export type PerformanceStatus = 'good' | 'average' | 'poor' | 'na';

export interface HealthcheckColumns {
  dataAccess: DataAccessStatus;
  performance: PerformanceStatus;
}

export const deriveHealthcheckColumns = (
  result: LayerValidationResult
): HealthcheckColumns => {
  const urls = result.urlResults;

  if (urls.length === 0) {
    return { dataAccess: 'pass', performance: 'good' };
  }

  const skippedCount = urls.filter(r => r.status === 'skipped').length;
  const errorCount = urls.filter(r => r.status === 'error').length;
  const validatable = urls.length - skippedCount;
  // 'valid' and 'performance-warning' both indicate the URL is reachable.
  const reachableCount = urls.filter(
    r => r.status === 'valid' || r.status === 'performance-warning'
  ).length;
  const perfWarningCount = urls.filter(r => r.status === 'performance-warning').length;

  let dataAccess: DataAccessStatus;
  if (validatable === 0) {
    dataAccess = 'na';
  } else if (errorCount === 0) {
    dataAccess = 'pass';
  } else if (reachableCount > 0) {
    dataAccess = 'partial';
  } else {
    dataAccess = 'fail';
  }

  let performance: PerformanceStatus;
  if (dataAccess === 'fail') {
    performance = 'na';
  } else if (perfWarningCount === 0) {
    performance = 'good';
  } else if (perfWarningCount === 1) {
    performance = 'average';
  } else {
    performance = 'poor';
  }

  return { dataAccess, performance };
};

export const dataAccessLabel: Record<DataAccessStatus, string> = {
  pass: 'Pass',
  partial: 'Partial Pass',
  fail: 'Fail',
  na: 'N/A',
};

export const performanceLabel: Record<PerformanceStatus, string> = {
  good: 'Good',
  average: 'Average',
  poor: 'Poor',
  na: '—',
};
