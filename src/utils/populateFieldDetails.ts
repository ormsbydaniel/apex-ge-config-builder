import type { DataSourceItem } from '@/types/dataSource';
import type { FieldsConfig } from '@/types/category';
import type { DetectedField } from '@/utils/fieldDetection';
import { assignFieldOrder } from '@/utils/fieldOrder';

/** Only these formats can currently be inspected by the field detector. */
export function fieldDetectionSources(sources: DataSourceItem[]) {
  return sources.flatMap((source, index) =>
    source.url && ['geojson', 'json', 'flatgeobuf', 'fgb'].includes(source.format?.toLowerCase())
      ? [{ ...source, index, url: source.url }]
      : []
  );
}

/** New fields follow existing rows; existing customisations (including hidden nulls) are untouched. */
export function mergeDetectedFields(fields: FieldsConfig, detected: DetectedField[]): FieldsConfig {
  const next: FieldsConfig = { ...fields };
  for (const { name, type } of detected) {
    if (!name || Object.prototype.hasOwnProperty.call(next, name)) continue;
    const normalized = type.toLowerCase();
    next[name] = normalized === 'date' || normalized === 'datetime' ? { type: normalized } : {};
  }
  return assignFieldOrder(next, Object.keys(next));
}