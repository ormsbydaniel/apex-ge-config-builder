/**
 * Samples features from a vector data source so the styling recipes can
 * auto-populate categories and numeric ranges instead of asking the user to
 * type them in.
 *
 * Supports GeoJSON/JSON and FlatGeoBuf, mirroring `fieldDetection.ts`.
 * All failures are non-fatal: callers fall back to manual entry.
 */

import { deserialize } from 'flatgeobuf/lib/mjs/geojson';

/** Hard cap on features inspected, to keep sampling cheap on large files. */
export const MAX_SAMPLED_FEATURES = 500;
/** Hard cap on distinct categories offered by the categorised recipe. */
export const MAX_CATEGORIES = 20;

export interface CategorySample {
  value: string;
  count: number;
}

export interface NumericSample {
  min: number;
  max: number;
  /** Sorted numeric values actually observed (used for quantile breaks). */
  values: number[];
}

export interface FieldSample {
  name: string;
  /** Loose type inferred from sampled values. */
  type: 'string' | 'number' | 'boolean' | 'other';
  categories?: CategorySample[];
  /** True when distinct values exceeded MAX_CATEGORIES (list is truncated). */
  categoriesTruncated?: boolean;
  numeric?: NumericSample;
}

export type SampledGeometry = 'polygon' | 'line' | 'point';

export interface GeometrySample {
  /** Most common geometry kind, or null when none was found. */
  dominant: SampledGeometry | null;
  counts: Record<SampledGeometry, number>;
}

export interface SourceSample {
  featureCount: number;
  /** Geometry kinds observed in the sampled features. */
  geometry?: GeometrySample;
  fields: FieldSample[];
  /** Populated when sampling failed; fields will be empty. */
  error?: string;
}

type Properties = Record<string, unknown>;

const isVectorSampleFormat = (format: string): boolean =>
  ['geojson', 'json', 'flatgeobuf', 'fgb'].includes(format.toLowerCase());

export const canSampleSource = (format: string): boolean => isVectorSampleFormat(format);

const inferType = (value: unknown): FieldSample['type'] => {
  if (typeof value === 'number' && Number.isFinite(value)) return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  return 'other';
};

/**
 * Turn a list of feature property bags into per-field samples.
 * Exported for direct use in tests and by callers that already hold features.
 */
export const summariseProperties = (rows: Properties[]): FieldSample[] => {
  const counts = new Map<string, Map<string, number>>();
  const numbers = new Map<string, number[]>();
  const types = new Map<string, Map<FieldSample['type'], number>>();

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    for (const [name, value] of Object.entries(row)) {
      if (value === null || value === undefined) continue;

      const type = inferType(value);
      const typeTally = types.get(name) ?? new Map<FieldSample['type'], number>();
      typeTally.set(type, (typeTally.get(type) ?? 0) + 1);
      types.set(name, typeTally);

      if (type === 'number') {
        const list = numbers.get(name) ?? [];
        list.push(value as number);
        numbers.set(name, list);
      }

      if (type === 'string' || type === 'boolean') {
        const key = String(value);
        const tally = counts.get(name) ?? new Map<string, number>();
        tally.set(key, (tally.get(key) ?? 0) + 1);
        counts.set(name, tally);
      }
    }
  }

  return Array.from(types.entries()).map(([name, typeTally]) => {
    // Dominant observed type wins when a field mixes types.
    const type = Array.from(typeTally.entries()).sort((a, b) => b[1] - a[1])[0][0];

    const sample: FieldSample = { name, type };

    const tally = counts.get(name);
    if (tally && (type === 'string' || type === 'boolean')) {
      const sorted = Array.from(tally.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      sample.categoriesTruncated = sorted.length > MAX_CATEGORIES;
      sample.categories = sorted.slice(0, MAX_CATEGORIES);
    }

    const nums = numbers.get(name);
    if (nums?.length && type === 'number') {
      const values = [...nums].sort((a, b) => a - b);
      sample.numeric = { min: values[0], max: values[values.length - 1], values };
    }

    return sample;
  }).sort((a, b) => a.name.localeCompare(b.name));
};

const geometryKind = (type: unknown): SampledGeometry | null => {
  switch (type) {
    case 'Point': case 'MultiPoint': return 'point';
    case 'LineString': case 'MultiLineString': return 'line';
    case 'Polygon': case 'MultiPolygon': return 'polygon';
    default: return null;
  }
};

/** Tally geometry kinds (Multi* folded into their base kind). */
export const summariseGeometries = (types: unknown[]): GeometrySample => {
  const counts: Record<SampledGeometry, number> = { polygon: 0, line: 0, point: 0 };
  for (const t of types) {
    const k = geometryKind(t);
    if (k) counts[k] += 1;
  }
  const best = (Object.entries(counts) as [SampledGeometry, number][])
    .sort((a, b) => b[1] - a[1])[0];
  return { dominant: best[1] > 0 ? best[0] : null, counts };
};

const sampleGeoJson = async (url: string, limit: number): Promise<SourceSample> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  let features: Array<{ properties?: Properties; geometry?: { type?: string } }> = [];

  if (data?.type === 'FeatureCollection' && Array.isArray(data.features)) {
    features = data.features;
  } else if (data?.type === 'Feature') {
    features = [data];
  }

  const slice = features.slice(0, limit);
  const rows = slice.map(f => (f?.properties ?? {}) as Properties);

  return {
    featureCount: features.length,
    fields: summariseProperties(rows),
    geometry: summariseGeometries(slice.map(f => f?.geometry?.type)),
  };
};

const sampleFlatGeobuf = async (url: string, limit: number): Promise<SourceSample> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch FlatGeoBuf: ${response.status} ${response.statusText}`);
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  const rows: Properties[] = [];
  const geomTypes: unknown[] = [];

  for await (const feature of deserialize(buffer) as AsyncIterable<{ properties?: Properties; geometry?: { type?: string } }>) {
    rows.push((feature?.properties ?? {}) as Properties);
    geomTypes.push(feature?.geometry?.type);
    if (rows.length >= limit) break;
  }

  return {
    featureCount: rows.length,
    fields: summariseProperties(rows),
    geometry: summariseGeometries(geomTypes),
  };
};

/**
 * Sample a vector source's attributes. Never throws — a failed sample returns
 * an `error` so the recipe UI can fall back to manual entry.
 */
export const sampleSourceData = async (
  url: string,
  format: string,
  limit: number = MAX_SAMPLED_FEATURES,
): Promise<SourceSample> => {
  const normalised = format.toLowerCase();

  try {
    if (normalised === 'geojson' || normalised === 'json') {
      return await sampleGeoJson(url, limit);
    }
    if (normalised === 'flatgeobuf' || normalised === 'fgb') {
      return await sampleFlatGeobuf(url, limit);
    }
    return {
      featureCount: 0,
      fields: [],
      error: `Sampling is not supported for ${format} sources.`,
    };
  } catch (error) {
    return {
      featureCount: 0,
      fields: [],
      error: error instanceof Error ? error.message : 'Could not read the vector source.',
    };
  }
};

/** Equal-interval breaks across a numeric range, returned as stop inputs. */
export const equalIntervalBreaks = (min: number, max: number, classes: number): number[] => {
  if (classes <= 0 || !Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (classes === 1 || min === max) return [min];
  const step = (max - min) / (classes - 1);
  return Array.from({ length: classes }, (_, i) => min + step * i);
};

/** Quantile breaks from observed values, returned as stop inputs. */
export const quantileBreaks = (values: number[], classes: number): number[] => {
  if (!values.length || classes <= 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  if (classes === 1) return [sorted[0]];
  return Array.from({ length: classes }, (_, i) => {
    const pos = (i / (classes - 1)) * (sorted.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.min(sorted.length - 1, lower + 1);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
  });
};
