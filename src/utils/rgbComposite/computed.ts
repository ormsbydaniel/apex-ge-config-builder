import type { DataSourceItem } from '@/types/dataSource';
import { resolveRecipeBands } from './recipes';

export type ComputedCompositeConfig = NonNullable<DataSourceItem['computedComposite']>;
export const COMPUTED_NAME = 'Barren soil';
export const COMPUTED_DESCRIPTION = 'Bare soil in red, vegetation in green, and SWIR reflectance in blue.';
export const COMPUTED_ROLES = ['Blue', 'Red', 'NIR', 'SWIR1'] as const;

/** Reuse the sensor mappings used by standard composites. */
export function resolveComputedBands(count: number, labels?: string[]): ComputedCompositeConfig['bands'] | null {
  if (labels?.some(Boolean)) {
    const hits = ['B2', 'B4', 'B8', 'B11'].map((name) => labels.findIndex((label) =>
      (label || '').toUpperCase().split(/[\s_\-():,]+/).map((token) => token.replace(/^B0+(\d)/, 'B$1')).includes(name)) + 1);
    if (hits.every((band) => band > 0 && band <= count)) return hits as ComputedCompositeConfig['bands'];
  }
  const natural = resolveRecipeBands('natural', count, labels);
  const agriculture = resolveRecipeBands('agriculture', count, labels);
  if (!natural || !agriculture) return null;
  const bands: ComputedCompositeConfig['bands'] = [natural[2], natural[0], agriculture[1], agriculture[0]];
  return new Set(bands).size === 4 ? bands : null;
}

/** openEO per-pixel output; loaded bands are renumbered Blue, Red, NIR, SWIR1. */
export function buildComputedStyle(cfg: ComputedCompositeConfig) {
  const blue = ['band', 1], red = ['band', 2], nir = ['band', 3], swir = ['band', 4];
  const soil = ['+', swir, red], other = ['+', nir, blue];
  const denominator = ['+', soil, other];
  const invalid: unknown[] = ['any', ['==', denominator, 0]];
  if (cfg.noData !== undefined) for (const band of [blue, red, nir, swir]) invalid.push(['==', band, cfg.noData]);
  const divisor = cfg.inputScale === 'dn' ? 10000 : 1;
  return {
    color: ['array',
      ['clamp', ['*', 2.5, ['/', ['-', soil, other], ['case', ['==', denominator, 0], 1, denominator]]], 0, 1],
      ['clamp', ['/', nir, divisor], 0, 1],
      ['clamp', ['/', swir, divisor], 0, 1],
      ['case', invalid, 0, 1],
    ],
  };
}