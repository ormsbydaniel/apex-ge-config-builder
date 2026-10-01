import type { HistogramBin } from '@/utils/cogMetadata';

/**
 * RGB composite recipes: intent-first band presets resolved against the
 * source's band labels (preferred) or a sensor guessed from the band count.
 * Output is plain band indices — no config schema change.
 */

export type RgbRecipeId = 'natural' | 'false-colour-ir' | 'agriculture' | 'geology' | 'custom';

export type SensorId = 'sentinel2-l2a' | 'sentinel2-l1c' | 'sentinel2-ard' | 'landsat-sr' | 'rgbn' | 'rgb';

export interface RgbRecipe {
  id: RgbRecipeId;
  name: string;
  description: string;
  /** Band names (Sentinel-2 style) used to match bandLabels. */
  bandNames?: [string, string, string];
}

export const RGB_RECIPES: RgbRecipe[] = [
  { id: 'natural', name: 'Natural colour', description: 'Red, green and blue bands — how the scene looks to the eye.', bandNames: ['B4', 'B3', 'B2'] },
  { id: 'false-colour-ir', name: 'False colour infrared', description: 'Near-infrared in red: healthy vegetation shows bright red.', bandNames: ['B8', 'B4', 'B3'] },
  { id: 'agriculture', name: 'Agriculture', description: 'SWIR, NIR and blue: separates crops, bare soil and water.', bandNames: ['B11', 'B8', 'B2'] },
  { id: 'geology', name: 'Urban / geology', description: 'Two SWIR bands and red: highlights built-up areas and rock types.', bandNames: ['B12', 'B11', 'B4'] },
  { id: 'custom', name: 'Custom', description: 'Pick any three bands by hand.' },
];

export const SENSOR_NAMES: Record<SensorId, string> = {
  'sentinel2-l2a': 'Sentinel-2 L2A (12 bands)',
  'sentinel2-l1c': 'Sentinel-2 L1C (13 bands)',
  'sentinel2-ard': 'Sentinel-2 ARD (10 bands, no B01/B09/B10)',
  'landsat-sr': 'Landsat 8/9 surface reflectance (7 bands)',
  rgbn: 'RGB + NIR (4 bands)',
  rgb: 'RGB (3 bands)',
};

/** Band indices (1-based) per sensor, keyed by recipe. */
const SENSOR_BANDS: Record<SensorId, Partial<Record<RgbRecipeId, [number, number, number]>>> = {
  'sentinel2-l2a': { natural: [4, 3, 2], 'false-colour-ir': [8, 4, 3], agriculture: [11, 8, 2], geology: [12, 11, 4] },
  'sentinel2-l1c': { natural: [4, 3, 2], 'false-colour-ir': [8, 4, 3], agriculture: [12, 8, 2], geology: [13, 12, 4] },
  // CEDA/Defra ARD stack: B02, B03, B04, B05, B06, B07, B08, B8A, B11, B12
  'sentinel2-ard': { natural: [3, 2, 1], 'false-colour-ir': [7, 3, 2], agriculture: [9, 7, 1], geology: [10, 9, 3] },
  'landsat-sr': { natural: [4, 3, 2], 'false-colour-ir': [5, 4, 3], agriculture: [6, 5, 2], geology: [7, 6, 4] },
  rgbn: { natural: [1, 2, 3], 'false-colour-ir': [4, 1, 2] },
  rgb: { natural: [1, 2, 3] },
};

export function guessSensor(bandCount: number): SensorId | null {
  switch (bandCount) {
    case 12: return 'sentinel2-l2a';
    case 13: return 'sentinel2-l1c';
    case 10: return 'sentinel2-ard';
    case 7: return 'landsat-sr';
    case 4: return 'rgbn';
    case 3: return 'rgb';
    default: return null;
  }
}

const normName = (s: string) => s.trim().toUpperCase().replace(/^B0+(\d)/, 'B$1');

/** Find a band index whose label matches a Sentinel-2 style name (B4, B04, "B04 - Red"...). */
function findLabel(labels: string[], name: string): number | null {
  const target = normName(name);
  for (let i = 0; i < labels.length; i++) {
    const tokens = (labels[i] || '').split(/[\s_\-():,]+/).filter(Boolean).map(normName);
    if (tokens.includes(target)) return i + 1;
  }
  return null;
}

/** Resolve a recipe to band indices, or null when the source can't support it. */
export function resolveRecipeBands(
  recipeId: RgbRecipeId,
  bandCount: number,
  bandLabels?: string[],
): [number, number, number] | null {
  const recipe = RGB_RECIPES.find((r) => r.id === recipeId);
  if (!recipe || recipe.id === 'custom') return null;
  if (bandLabels && bandLabels.some(Boolean) && recipe.bandNames) {
    const hits = recipe.bandNames.map((n) => findLabel(bandLabels, n));
    if (hits.every((h): h is number => h !== null && h <= bandCount)) return hits as [number, number, number];
  }
  const sensor = guessSensor(bandCount);
  const bands = sensor ? SENSOR_BANDS[sensor][recipeId] : undefined;
  return bands && bands.every((b) => b <= bandCount) ? bands : null;
}

/** Which recipe (if any) the given bands correspond to. */
export function matchRecipe(bands: number[], bandCount: number, bandLabels?: string[]): RgbRecipeId {
  for (const r of RGB_RECIPES) {
    const resolved = resolveRecipeBands(r.id, bandCount, bandLabels);
    if (resolved && resolved.every((b, i) => b === bands[i])) return r.id;
  }
  return 'custom';
}

// ── Stretches ──────────────────────────────────────────────

export type StretchMethod = 'percent-2-98' | 'min-max' | 'mean-2sd';

export const STRETCH_METHODS: { id: StretchMethod; name: string; description: string }[] = [
  { id: 'percent-2-98', name: '2–98% cut', description: 'Ignore the darkest and brightest 2% of pixels. Best default for imagery.' },
  { id: 'min-max', name: 'Min – max', description: 'Use the full sampled value range.' },
  { id: 'mean-2sd', name: 'Mean ± 2σ', description: 'Centre on the average, two standard deviations either side.' },
];

export function percentileFromBins(bins: HistogramBin[], pct: number): number {
  const total = bins.reduce((s, b) => s + b.count, 0);
  if (!bins.length || total === 0) return 0;
  const target = total * (pct / 100);
  let cum = 0;
  for (const b of bins) {
    cum += b.count;
    if (cum >= target) return b.x;
  }
  return bins[bins.length - 1].x;
}

/** Round a stretch outward to a tidy value (≈2 significant figures of the span). */
export function tidyStretch(min: number, max: number): { min: number; max: number } {
  const span = max - min;
  if (!isFinite(span) || span <= 0) return { min, max };
  const step = Math.pow(10, Math.floor(Math.log10(span)) - 1);
  const r = (v: number) => parseFloat(v.toPrecision(12));
  return { min: r(Math.floor(min / step) * step), max: r(Math.ceil(max / step) * step) };
}

export function computeStretch(
  method: StretchMethod,
  hist: { bins: HistogramBin[]; min: number; max: number },
): { min: number; max: number } {
  let lo: number, hi: number;
  if (method === 'min-max') {
    lo = hist.min; hi = hist.max;
  } else if (method === 'percent-2-98') {
    lo = percentileFromBins(hist.bins, 2); hi = percentileFromBins(hist.bins, 98);
  } else {
    const total = hist.bins.reduce((s, b) => s + b.count, 0) || 1;
    const mean = hist.bins.reduce((s, b) => s + b.x * b.count, 0) / total;
    const variance = hist.bins.reduce((s, b) => s + b.count * (b.x - mean) ** 2, 0) / total;
    const sd = Math.sqrt(variance);
    lo = Math.max(hist.min, mean - 2 * sd); hi = Math.min(hist.max, mean + 2 * sd);
  }
  if (!(hi > lo)) { lo = hist.min; hi = hist.max; }
  return tidyStretch(lo, hi);
}
