/**
 * Named helpers that community templates can opt into. Templates refer to
 * these by name only, so they never carry code. Names are a stable contract:
 * add new ones, never rename.
 */
import { DataInsight, probeStacCollection, probeStacCount, probeVectorExtent, probeWmsLayers } from './dataProbes';
import type { TransformHelper } from './patchEngine';
import { buildStacSearchUrl, eoxYears, extentRange, extentYears, stacPeriod, WizardOption, wmsLayerOptions } from './templates';

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const isUrl = (v: unknown) => /^https?:\/\//i.test(str(v));

/** Value helpers usable in `computed`, patches and helper args. */
export const TRANSFORMS: Record<string, TransformHelper> = {
  slug: ({ text }) => str(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app',
  number: ({ value }) => Number(value),
  /** Start/end of a season-and-year or custom period (fields: season, year, start, end). */
  periodStart: (a) => stacPeriod({ season: str(a.season), year: str(a.year), start: str(a.start), end: str(a.end) })[0],
  periodEnd: (a) => stacPeriod({ season: str(a.season), year: str(a.year), start: str(a.start), end: str(a.end) })[1],
  stacSearchUrl: (a) => {
    const center = a.center as [number, number];
    const cloud = a.maxCloud === undefined || a.maxCloud === '' ? undefined : Number(a.maxCloud);
    return buildStacSearchUrl(str(a.collection), center, Number(a.zoom), str(a.start), str(a.end), cloud,
      a.filterStyle === 'cql2' ? 'cql2' : 'query');
  },
  singleKeyObject: ({ key, value }) => ({ [str(key)]: value }),
  list: (a) => Object.keys(a).sort().map((k) => a[k]),
};

export const OPTIONS_FROM: Record<string, (i: DataInsight) => WizardOption[] | null> = {
  probeYears: eoxYears,
  wmsLayers: wmsLayerOptions,
  extentYears,
};

export const RANGE_FROM: Record<string, (i: DataInsight) => { min?: string; max?: string }> = {
  temporalExtent: extentRange,
};

export const PROBES: Record<string, (args: Record<string, unknown>) => Promise<DataInsight> | null> = {
  wmsLayers: ({ url }) => (isUrl(url) ? probeWmsLayers(str(url)) : null),
  stacCollection: ({ url }) => (isUrl(url) ? probeStacCollection(str(url)) : null),
  vectorExtent: ({ url }) => (isUrl(url) ? probeVectorExtent(str(url)) : null),
};

export const LIVE_CHECKS: Record<string, (args: Record<string, unknown>) => Promise<string | null>> = {
  stacSceneCount: async ({ url }) => {
    if (!isUrl(url)) return null;
    const n = await probeStacCount(str(url));
    if (n === null) return null;
    return n === 0
      ? 'No scenes found for this place and period. Try a longer period or move the map.'
      : `${n} scene${n === 1 ? '' : 's'} found for this place and period.`;
  },
};
