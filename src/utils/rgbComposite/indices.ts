import { COLORMAP_DATA } from '@/constants/colormapData';
import suppliedPalettes from '@/constants/indexPalettes.json';
import { guessSensor, type SensorId } from './recipes';

/**
 * Spectral index recipes: normalised difference indices (A − B) / (A + B)
 * computed per pixel on the GPU by the OpenLayers WebGL tile layer.
 * Bands resolve from band labels (Sentinel-2 names) first, then from the
 * sensor guessed from the band count — same strategy as the RGB recipes.
 */

export type IndexRecipeId = 'ndvi' | 'ndwi' | 'mndwi' | 'ndbi' | 'nbr' | 'ndre' | 'custom-index';

export type BandRole = 'green' | 'red' | 'rededge1' | 'nir' | 'swir1' | 'swir2';

export interface IndexLegendStop {
  value: number;
  color: string;
  meaning: string;
}

/** Absolute value stops, shared by rendering and the exported viewer legend. */
export const INDEX_PALETTES = Object.fromEntries(
  Object.entries(suppliedPalettes).map(([id, palette]) => [id.toLowerCase(), palette]),
) as Record<Exclude<IndexRecipeId, 'custom-index'>, { name: string; displayMin: number; displayMax: number; stops: IndexLegendStop[] }>;

export function recipePalette(id: IndexRecipeId) {
  return id === 'custom-index' ? undefined : INDEX_PALETTES[id];
}

export function recipeLegendStops(id: IndexRecipeId): IndexLegendStop[] | undefined {
  return recipePalette(id)?.stops.map((stop) => ({ ...stop }));
}

export function cloneLegendStops(stops: IndexLegendStop[]): IndexLegendStop[] {
  return stops.map((stop) => ({ ...stop }));
}

export function validateLegendStops(stops: IndexLegendStop[]): string | null {
  if (stops.length < 2) return 'Add at least two colour stops.';
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    if (!Number.isFinite(stop.value) || stop.value < -1 || stop.value > 1) return 'Stop values must be between −1 and 1.';
    if (!/^#[0-9a-f]{6}$/i.test(stop.color)) return 'Each stop needs a valid six-digit hex colour.';
    if (!stop.meaning.trim()) return 'Each stop needs a legend meaning.';
    if (i > 0 && stop.value <= stops[i - 1].value) return 'Stop values must be in strictly increasing order.';
  }
  return null;
}

/** Recolour existing rows while preserving their values and legend meanings. */
export function recolourLegendStops(stops: IndexLegendStop[], colors: string[]): IndexLegendStop[] {
  if (!colors.length) return cloneLegendStops(stops);
  if (stops.length === 1) return [{ ...stops[0], color: colors[Math.floor(colors.length / 2)] }];
  return stops.map((stop, index) => {
    const position = (index / (stops.length - 1)) * (colors.length - 1);
    const nearest = Math.round(position);
    return { ...stop, color: colors[nearest] };
  });
}

export function paletteGradient(stops: IndexLegendStop[]): string {
  if (stops.length < 2) return '';
  const min = stops[0].value;
  const span = stops[stops.length - 1].value - min;
  return `linear-gradient(to right, ${stops.map((stop) => `${stop.color} ${((stop.value - min) / span) * 100}%`).join(', ')})`;
}

export interface IndexRangePreset {
  label: string;
  min: number;
  max: number;
  /** Optional visible-range mask applied with the preset; omitted = show all (−1..1). */
  visibleMin?: number;
  visibleMax?: number;
}

export interface IndexRecipe {
  id: IndexRecipeId;
  name: string;
  fullName: string;
  description: string;
  formula: string;
  roles?: [BandRole, BandRole];
  colormap: string;
  reverse: boolean;
  min: number;
  max: number;
  /** Quick range shortcuts shown in the editor; falls back to the generic presets. */
  presets?: IndexRangePreset[];
}

const FULL: IndexRangePreset = { label: 'Full range', min: -1, max: 1 };
const POS: IndexRangePreset = { label: 'Positive only', min: 0, max: 1 };
const BALANCED: IndexRangePreset = { label: 'Balanced', min: -0.5, max: 0.5 };

/**
 * Defaults keep 0 (the physical inflection point of every normalised difference)
 * meaningful: diverging ramps are centred on 0, sequential ramps start near it.
 * Task presets ("Open water" etc.) keep the ramp and hide values via the visible range.
 */
export const INDEX_RECIPES: IndexRecipe[] = [
  { id: 'ndvi', name: 'NDVI', fullName: 'Vegetation (NDVI)', description: 'Vegetation density and health — dense, healthy vegetation shows dark green.', formula: '(NIR − Red) / (NIR + Red)', roles: ['nir', 'red'], colormap: 'greens', reverse: true, min: 0, max: 0.8,
    presets: [FULL, { label: 'Vegetation ramp', min: 0, max: 0.8 }, { label: 'Vegetation only', min: 0, max: 0.8, visibleMin: 0.1, visibleMax: 1 }] },
  { id: 'ndwi', name: 'NDWI', fullName: 'Water (NDWI)', description: 'Open water bodies — water shows blue, land stays red/white.', formula: '(Green − NIR) / (Green + NIR)', roles: ['green', 'nir'], colormap: 'rdbu', reverse: true, min: -0.5, max: 0.5,
    presets: [FULL, BALANCED, { label: 'Open water', min: -0.5, max: 0.5, visibleMin: 0, visibleMax: 1 }] },
  { id: 'mndwi', name: 'MNDWI', fullName: 'Modified water (MNDWI)', description: 'Water in built-up areas — suppresses noise from buildings.', formula: '(Green − SWIR1) / (Green + SWIR1)', roles: ['green', 'swir1'], colormap: 'rdbu', reverse: true, min: -0.5, max: 0.5,
    presets: [FULL, BALANCED, { label: 'Open water', min: -0.5, max: 0.5, visibleMin: 0, visibleMax: 1 }] },
  { id: 'ndbi', name: 'NDBI', fullName: 'Built-up (NDBI)', description: 'Built-up and impervious surfaces — urban areas show red.', formula: '(SWIR1 − NIR) / (SWIR1 + NIR)', roles: ['swir1', 'nir'], colormap: 'yiorrd', reverse: true, min: 0, max: 0.5,
    presets: [FULL, { label: 'Built-up ramp', min: 0, max: 0.5 }, { label: 'Urban / built-up', min: 0, max: 0.5, visibleMin: 0, visibleMax: 1 }] },
  { id: 'nbr', name: 'NBR', fullName: 'Burn ratio (NBR)', description: 'Fire scars and burn severity — burnt ground shows dark.', formula: '(NIR − SWIR2) / (NIR + SWIR2)', roles: ['nir', 'swir2'], colormap: 'inferno', reverse: false, min: -0.2, max: 0.8,
    presets: [FULL, { label: 'Vegetation to burn', min: -0.2, max: 0.8 }, { label: 'Burn scars', min: -0.5, max: 0.1, visibleMin: -1, visibleMax: 0.1 }] },
  { id: 'ndre', name: 'NDRE', fullName: 'Red edge (NDRE)', description: 'Canopy chlorophyll — sensitive in dense crops where NDVI saturates.', formula: '(NIR − Red edge) / (NIR + Red edge)', roles: ['nir', 'rededge1'], colormap: 'viridis', reverse: false, min: 0, max: 0.8,
    presets: [FULL, { label: 'Canopy ramp', min: 0, max: 0.8 }, { label: 'Dense canopy', min: 0, max: 0.8, visibleMin: 0.2, visibleMax: 1 }] },
  { id: 'custom-index', name: 'Custom index', fullName: 'Custom index', description: 'Pick any two bands: (A − B) / (A + B).', formula: '(A − B) / (A + B)', colormap: 'viridis', reverse: false, min: -1, max: 1 },
];

/** Colour ramps offered for index styling. */
export const INDEX_COLORMAPS = ['greens', 'viridis', 'inferno', 'magma', 'plasma', 'yiorrd', 'rdbu', 'yignbu', 'cool-water', 'earth', 'greys']
  .filter((c) => c in COLORMAP_DATA);

/** Sentinel-2 band names used to match band labels per role. */
const ROLE_S2_NAME: Record<BandRole, string> = {
  green: 'B3', red: 'B4', rededge1: 'B5', nir: 'B8', swir1: 'B11', swir2: 'B12',
};

const SENSOR_ROLES: Record<SensorId, Partial<Record<BandRole, number>>> = {
  'sentinel2-l2a': { green: 3, red: 4, rededge1: 5, nir: 8, swir1: 11, swir2: 12 },
  'sentinel2-l1c': { green: 3, red: 4, rededge1: 5, nir: 8, swir1: 12, swir2: 13 },
  'sentinel2-ard': { green: 2, red: 3, rededge1: 4, nir: 7, swir1: 9, swir2: 10 },
  'landsat-sr': { green: 3, red: 4, nir: 5, swir1: 6, swir2: 7 },
  rgbn: { red: 1, green: 2, nir: 4 },
  rgb: {},
};

const normName = (s: string) => s.trim().toUpperCase().replace(/^B0+(\d)/, 'B$1');

function findLabel(labels: string[], name: string): number | null {
  const target = normName(name);
  for (let i = 0; i < labels.length; i++) {
    const tokens = (labels[i] || '').split(/[\s_\-():,]+/).filter(Boolean).map(normName);
    if (tokens.includes(target)) return i + 1;
  }
  return null;
}

export function resolveIndexBands(id: IndexRecipeId, bandCount: number, bandLabels?: string[]): [number, number] | null {
  const recipe = INDEX_RECIPES.find((r) => r.id === id);
  if (!recipe?.roles) return null;
  if (bandLabels && bandLabels.some(Boolean)) {
    const hits = recipe.roles.map((r) => findLabel(bandLabels, ROLE_S2_NAME[r]));
    if (hits.every((h): h is number => h !== null && h <= bandCount)) return hits as [number, number];
  }
  const sensor = guessSensor(bandCount);
  if (!sensor) return null;
  const a = SENSOR_ROLES[sensor][recipe.roles[0]];
  const b = SENSOR_ROLES[sensor][recipe.roles[1]];
  return a && b && a <= bandCount && b <= bandCount ? [a, b] : null;
}

export function matchIndexRecipe(bands: [number, number], bandCount: number, bandLabels?: string[]): IndexRecipeId {
  for (const r of INDEX_RECIPES) {
    const res = resolveIndexBands(r.id, bandCount, bandLabels);
    if (res && res[0] === bands[0] && res[1] === bands[1]) return r.id;
  }
  return 'custom-index';
}

/** Saved alongside the style so the editor can reopen an index layer. */
export interface SpectralIndexConfig {
  recipe: IndexRecipeId;
  bandA: number;
  bandB: number;
  colormap: string;
  reverse?: boolean;
  min: number;
  max: number;
  /** Explicitly opts into the absolute recipe stops; absent on legacy/generic styles. */
  paletteMode?: 'recipe' | 'custom';
  /** Snapshot of the rendered recipe stops for the Explorer's future legend. */
  legendStops?: IndexLegendStop[];
  /** Visibility mask: pixels with index values outside [visibleMin, visibleMax] are transparent. Omitted = no mask. */
  visibleMin?: number;
  visibleMax?: number;
}

/** Rebuild the legend snapshot from the same source used to compile the style. */
export function withRecipePalette(cfg: SpectralIndexConfig): SpectralIndexConfig {
  if (cfg.paletteMode === 'custom') return { ...cfg, legendStops: cloneLegendStops(cfg.legendStops ?? []) };
  const { legendStops, ...rest } = cfg;
  if (cfg.paletteMode !== 'recipe' || !recipePalette(cfg.recipe)) {
    const { paletteMode, ...generic } = rest;
    return generic;
  }
  return { ...rest, paletteMode: 'recipe', legendStops: recipeLegendStops(cfg.recipe) };
}

/** Returns cfg with visible bounds set, omitting bounds that do not narrow the full −1..1 range. */
export function withVisibleRange<T extends SpectralIndexConfig>(cfg: T, vmin: number, vmax: number): T {
  const { visibleMin, visibleMax, ...rest } = cfg;
  const out = { ...rest } as T;
  if (vmin > -1) out.visibleMin = vmin;
  if (vmax < 1) out.visibleMax = vmax;
  return out;
}

/** Colour stops of a ramp spread across [min, max]. */
export function indexColorStops(colormap: string, reverse: boolean, min: number, max: number): [number, [number, number, number, number]][] {
  const stops = COLORMAP_DATA[colormap] ?? COLORMAP_DATA.viridis;
  const ordered = reverse ? stops.map((s) => ({ index: 1 - s.index, rgb: s.rgb })).reverse() : stops;
  const out: [number, [number, number, number, number]][] = [];
  let last = -Infinity;
  for (const s of ordered) {
    const v = parseFloat((min + s.index * (max - min)).toPrecision(10));
    if (v <= last) continue; // OpenLayers needs strictly ascending stops
    last = v;
    out.push([v, [s.rgb[0], s.rgb[1], s.rgb[2], 1]]);
  }
  return out;
}

/**
 * OpenLayers WebGL tile style for a normalised difference index.
 * The data item saves `bands: [bandA, bandB]`; the viewer loads only those and
 * renumbers them, so the style always reads band 1 (A) and band 2 (B).
 */
export function buildIndexStyle(cfg: SpectralIndexConfig) {
  const a = ['band', 1];
  const b = ['band', 2];
  const sum = ['+', a, b];
  const index = ['/', ['-', a, b], sum];
  const paletteStops = cfg.paletteMode === 'custom' ? cfg.legendStops : cfg.paletteMode === 'recipe' ? recipePalette(cfg.recipe)?.stops : undefined;
  const stops = (paletteStops
    ? paletteStops.map((s): [number, [number, number, number, number]] => {
        const rgb = [1, 3, 5].map((i) => parseInt(s.color.slice(i, i + 2), 16));
        return [s.value, [rgb[0], rgb[1], rgb[2], 1]];
      })
    : indexColorStops(cfg.colormap, !!cfg.reverse, cfg.min, cfg.max)
  ).flatMap(([v, c]) => [v, c]);
  return {
    color: [
      'case',
      ['<=', sum, 0],
      [0, 0, 0, 0],
      ...(cfg.visibleMin != null && cfg.visibleMin > -1 ? [['<', index, cfg.visibleMin], [0, 0, 0, 0]] : []),
      ...(cfg.visibleMax != null && cfg.visibleMax < 1 ? [['>', index, cfg.visibleMax], [0, 0, 0, 0]] : []),
      ['interpolate', ['linear'], index, ...stops],
    ],
  };
}

/** Generic range shortcuts, used for recipes without their own presets. */
export const INDEX_RANGE_PRESETS: IndexRangePreset[] = [FULL, POS];

/** Range preset buttons for a recipe — its own presets, or the generic pair. */
export function indexRangePresets(id: IndexRecipeId): IndexRangePreset[] {
  return INDEX_RECIPES.find((r) => r.id === id)?.presets ?? INDEX_RANGE_PRESETS;
}
