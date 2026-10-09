/**
 * Finds the first data file in a layer that actually carries attribute
 * columns. Multi-file layers can mix attribute-less files with ones that have
 * attributes, so stopping at the first file would miss the attributes.
 * STAC items are probed through their in-memory resolved sample asset URL;
 * the resolved URL is never persisted.
 */

import { detectFieldsFromSource, type DetectedField } from '@/utils/fieldDetection';
import { isVectorDataSource, resolveDataSourceInspectionAccess } from '@/utils/stacAssetFormat';
import type { DataSourceItem } from '@/types/config';

export interface AttributeSource {
  url: string;
  format: string;
  fields: DetectedField[];
  /** Number of files inspected before a match (or all, when none matched). */
  inspected: number;
}

/** Hard cap on files probed, so huge layers stay responsive. */
export const MAX_PROBED_FILES = 50;

type ProbeableItem = Pick<DataSourceItem, 'url' | 'format' | 'assets' | 'assetFormats'>;

export async function pickAttributeSource(
  items: ProbeableItem[],
  detect: typeof detectFieldsFromSource = detectFieldsFromSource,
): Promise<AttributeSource | null> {
  const candidates = items
    .filter((i): i is ProbeableItem & { url: string } => !!i.url && !!i.format && isVectorDataSource(i))
    .slice(0, MAX_PROBED_FILES);
  let inspected = 0;
  let lastError: unknown = null;
  for (const item of candidates) {
    inspected += 1;
    try {
      // STAC items inspect the resolved sample asset; direct sources use their own URL.
      const access = await resolveDataSourceInspectionAccess(item);
      if (!access || !isVectorDataSource({ ...item, format: access.format })) continue;
      const fields = await detect(access.url, access.format);
      if (fields.length > 0) return { url: access.url, format: access.format, fields, inspected };
    } catch (error) {
      lastError = error;
    }
  }
  if (inspected > 0 && lastError && inspected === 1) throw lastError;
  return null;
}
