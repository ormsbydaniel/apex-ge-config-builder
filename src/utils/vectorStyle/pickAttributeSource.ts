/**
 * Finds the first data file in a layer that actually carries attribute
 * columns. Multi-file layers can mix attribute-less files with ones that have
 * attributes, so stopping at the first file would miss the attributes.
 */

import { detectFieldsFromSource, isVectorFormat, type DetectedField } from '@/utils/fieldDetection';

export interface AttributeSource {
  url: string;
  format: string;
  fields: DetectedField[];
  /** Number of files inspected before a match (or all, when none matched). */
  inspected: number;
}

/** Hard cap on files probed, so huge layers stay responsive. */
export const MAX_PROBED_FILES = 50;

export async function pickAttributeSource(
  items: Array<{ url?: string; format?: string }>,
  detect: typeof detectFieldsFromSource = detectFieldsFromSource,
): Promise<AttributeSource | null> {
  const candidates = items
    .filter((i): i is { url: string; format: string } => !!i.url && !!i.format && isVectorFormat(i.format))
    .slice(0, MAX_PROBED_FILES);
  let inspected = 0;
  let lastError: unknown = null;
  for (const item of candidates) {
    inspected += 1;
    try {
      const fields = await detect(item.url, item.format);
      if (fields.length > 0) return { url: item.url, format: item.format, fields, inspected };
    } catch (error) {
      lastError = error;
    }
  }
  if (inspected > 0 && lastError && inspected === 1) throw lastError;
  return null;
}
