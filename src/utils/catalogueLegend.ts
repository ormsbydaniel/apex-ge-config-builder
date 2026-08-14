/**
 * Converts catalogue legend definitions (from a catalogue collection JSON) into
 * the builder's own styling structures: categories, named colormaps, or a
 * truthful two-stop gradient fallback.
 */

import {
  CatalogueLegend,
  CatalogueLegendEntry,
  CatalogueLayer,
  CatalogueLayerStyle,
  CatalogueLabelSource,
} from '@/types/service';
import { Category, Colormap } from '@/types/category';
import { COLORMAP_DATA } from '@/constants/colormapData';
import { generateColorRamp } from '@/utils/colormapUtils';
import { resolveColormapName } from '@/utils/colormapNameMapping';


export interface CategoriesSuggestion {
  kind: 'categories';
  categories: Category[];
  units?: string;
  /** How many classes carry an officially sourced label. */
  labelledCount?: number;
  /** Provenance of the class labels, when known. */
  labelSource?: CatalogueLabelSource;
}


export interface ColormapSuggestion {
  kind: 'colormap';
  colormap: Colormap;
  units?: string;
  /** True when the ramp was matched by colour comparison rather than a name hint. */
  matched?: boolean;
  /** The colormap name as given by the catalogue, when it came from a name hint. */
  sourceName?: string;
  /** True when the catalogue name differed from our preset name (alias match). */
  alias?: boolean;
}


export interface GradientSuggestion {
  kind: 'gradient';
  min: number;
  max: number;
  startColor: string;
  endColor: string;
  units?: string;
}

/** The dataset's official legend graphic, used when no faithful translation exists. */
export interface LegendImageSuggestion {
  kind: 'legendImage';
  url: string;
  pageUrl?: string;
  units?: string;
}

export type CatalogueStyleSuggestion =
  | CategoriesSuggestion
  | ColormapSuggestion
  | GradientSuggestion
  | LegendImageSuggestion;

const HEX_RE = /^#?([0-9a-f]{6})$/i;

export const hexToRgb = (hex: string): [number, number, number] | null => {
  const match = HEX_RE.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const normaliseHex = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

/** Legend entries with the no-data sentinels removed. */
export const legendRampEntries = (legend: CatalogueLegend): CatalogueLegendEntry[] => {
  const noDataValues = new Set((legend.noData || []).map(entry => entry.value));
  return (legend.entries || []).filter(entry => !noDataValues.has(entry.value));
};

/** Discrete legend -> categories, using the value as label when none is given. */
export const legendToCategories = (legend: CatalogueLegend): Category[] =>
  legendRampEntries(legend).map(entry => ({
    value: entry.value,
    color: normaliseHex(entry.color),
    label: entry.label && entry.label.trim() ? entry.label : String(entry.value),
  }));

/** Root-mean-square distance (0-255 scale) between a legend and a preset ramp. */
const rampError = (
  colors: Array<[number, number, number]>,
  presetName: string,
  reverse: boolean,
): number => {
  const preset = generateColorRamp(presetName, colors.length, reverse);
  let total = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let c = 0; c < 3; c++) {
      const diff = colors[i][c] - preset[i][c];
      total += diff * diff;
    }
  }
  return Math.sqrt(total / (colors.length * 3));
};

export interface NamedColormapMatch {
  name: string;
  reverse: boolean;
  error: number;
}

/**
 * Attempts to match the legend colours against a preset colour ramp.
 * Only tight fits are accepted so that we never mislabel a bespoke ramp.
 */
export const matchNamedColormap = (
  legend: CatalogueLegend,
  tolerance = 12,
): NamedColormapMatch | null => {
  const entries = legendRampEntries(legend);
  if (entries.length < 3) return null;

  // Sample evenly by value so uneven legend spacing does not skew the match.
  const sorted = [...entries].sort((a, b) => a.value - b.value);
  const colors: Array<[number, number, number]> = [];
  for (const entry of sorted) {
    const rgb = hexToRgb(entry.color);
    if (!rgb) return null;
    colors.push(rgb);
  }

  let best: NamedColormapMatch | null = null;
  for (const name of Object.keys(COLORMAP_DATA)) {
    for (const reverse of [false, true]) {
      const error = rampError(colors, name, reverse);
      if (!best || error < best.error) best = { name, reverse, error };
    }
  }
  if (best && best.error <= tolerance) return best;
  return null;
};

const legendUnits = (legend: CatalogueLegend): string | undefined =>
  legend.units && legend.units.trim() ? legend.units : undefined;

const isDiscrete = (legend: CatalogueLegend): boolean => {
  if (legend.type === 'discrete') return true;
  if (legend.type === 'continuous') return false;
  return legend.min === undefined && legend.max === undefined;
};

/** Builds the styling suggestion the builder should apply for a legend. */
export const legendToStyleSuggestion = (
  legend?: CatalogueLegend | null,
): CatalogueStyleSuggestion | null => {
  if (!legend) return null;
  const entries = legendRampEntries(legend);
  if (entries.length === 0) return null;
  const units = legendUnits(legend);

  if (isDiscrete(legend)) {
    const labelledCount =
      legend.officialLabelCount ?? entries.filter(entry => !!entry.label?.trim()).length;
    return {
      kind: 'categories',
      categories: legendToCategories(legend),
      units,
      labelledCount,
      labelSource: legend.labelSource,
    };
  }


  const sorted = [...entries].sort((a, b) => a.value - b.value);
  const min = legend.min ?? sorted[0].value;
  const max = legend.max ?? sorted[sorted.length - 1].value;
  const steps = legend.steps ?? sorted.length;

  const hinted = resolveColormapName(legend.colormapName);
  if (hinted) {
    return {
      kind: 'colormap',
      colormap: {
        name: hinted.name,
        min,
        max,
        steps,
        // A '_r' style suffix and an explicit reverse flag together cancel out.
        reverse: hinted.reverse !== (legend.reverse ?? false),
      },
      units,
      sourceName: legend.colormapName,
      alias: !hinted.exact,
    };
  }



  const matched = matchNamedColormap(legend);
  if (matched) {
    return {
      kind: 'colormap',
      colormap: { name: matched.name, min, max, steps, reverse: matched.reverse },
      units,
      matched: true,
    };
  }

  return {
    kind: 'gradient',
    min,
    max,
    startColor: normaliseHex(sorted[0].color),
    endColor: normaliseHex(sorted[sorted.length - 1].color),
    units,
  };
};

/** The first style on a layer that carries a usable legend. */
export const primaryLayerLegend = (layer: CatalogueLayer): CatalogueLegend | undefined =>
  (layer.styles || []).find(style => (style.legend?.entries?.length ?? 0) > 0)?.legend;

/** A concise unit for the layer, ignoring the verbose `unitsRaw` wording. */
export const layerUnits = (layer: CatalogueLayer): string | undefined =>
  layer.units && layer.units.trim() ? layer.units.trim() : undefined;

/** The dataset's official legend graphic, when one was published. */
export const datasetLegendImage = (
  dataset?: CatalogueDataset | null,
): CatalogueLegendImage | undefined => {
  const image = dataset?.style?.legendImage;
  return image?.imageUrl ? image : undefined;
};

/**
 * Style suggestion for a catalogue layer, preferring the layer's own band units
 * when the legend does not carry any. When the legend cannot be translated
 * faithfully (no legend, suppressed, or only a two-stop gradient fallback) the
 * dataset's official legend graphic is used instead, where one exists.
 */
export const layerStyleSuggestion = (
  layer: CatalogueLayer,
  dataset?: CatalogueDataset | null,
): CatalogueStyleSuggestion | null => {
  const suggestion = legendToStyleSuggestion(primaryLayerLegend(layer));
  const units = layerUnits(layer);
  const image = datasetLegendImage(dataset);

  if (!suggestion || suggestion.kind === 'gradient') {
    if (image) {
      return {
        kind: 'legendImage',
        url: image.imageUrl as string,
        ...(image.pageUrl ? { pageUrl: image.pageUrl } : {}),
        ...(suggestion?.units || units ? { units: suggestion?.units || units } : {}),
      };
    }
  }

  if (!suggestion) return null;
  if (suggestion.units) return suggestion;
  return units ? { ...suggestion, units } : suggestion;
};

/** A style whose legend was deliberately suppressed during discovery. */
export const suppressedLegendStyle = (
  layer: CatalogueLayer,
): CatalogueLayerStyle | undefined =>
  (layer.styles || []).find(
    style => style.legendDiscovery?.status === 'suppressed' && !style.legend,
  );

/** Short band metadata summary, e.g. 'INT16 · scale 0.001 · range 0–20 mm/day'. */
export const describeBandMetadata = (layer: CatalogueLayer): string | null => {
  const parts: string[] = [];
  if (layer.sourceFormat) parts.push(layer.sourceFormat);
  if (layer.scale !== undefined && layer.scale !== 1) parts.push(`scale ${layer.scale}`);
  if (layer.offset !== undefined && layer.offset !== 0) parts.push(`offset ${layer.offset}`);
  const { min, max } = layer.dataRange || {};
  if (min !== undefined && max !== undefined) {
    parts.push(`range ${min}–${max}${layerUnits(layer) ? ` ${layerUnits(layer)}` : ''}`);
  }
  return parts.length ? parts.join(' · ') : null;
};

/**
 * Note shown when the legend visualises a narrower window than the physical
 * data range, so the author can widen the colormap deliberately.
 */
export const describeRangeMismatch = (
  layer: CatalogueLayer,
  suggestion: CatalogueStyleSuggestion | null,
): string | null => {
  if (!suggestion || suggestion.kind === 'categories') return null;
  const { min: dMin, max: dMax } = layer.dataRange || {};
  if (dMin === undefined || dMax === undefined) return null;
  const sMin = suggestion.kind === 'colormap' ? suggestion.colormap.min : suggestion.min;
  const sMax = suggestion.kind === 'colormap' ? suggestion.colormap.max : suggestion.max;
  if (sMin === dMin && sMax === dMax) return null;
  const units = layerUnits(layer) ? ` ${layerUnits(layer)}` : '';
  return `Legend shows ${sMin}–${sMax} of a ${dMin}–${dMax}${units} data range`;
};

/** One-line description of what will be applied when the layer is added. */
export const describeStyleSuggestion = (suggestion: CatalogueStyleSuggestion): string => {
  switch (suggestion.kind) {
    case 'categories': {
      const total = suggestion.categories.length;
      const labelled = suggestion.labelledCount ?? 0;
      const coverage = labelled > 0 && labelled < total ? ` (${labelled} labelled)` : '';
      return `Categories: ${total} class${total !== 1 ? 'es' : ''}${coverage}`;
    }

    case 'colormap': {
      const origin = suggestion.matched
        ? ' — matched by colour'
        : suggestion.alias && suggestion.sourceName
          ? ` — from “${suggestion.sourceName}”`
          : '';
      return `Colormap: ${suggestion.colormap.name}${suggestion.colormap.reverse ? ' (reversed)' : ''}, ${suggestion.colormap.min}–${suggestion.colormap.max}${origin}`;
    }

    case 'gradient':
      return `Gradient ${suggestion.min}–${suggestion.max} — no matching preset`;
  }
};

/** CSS background used for the legend preview swatch/strip. */
export const styleSuggestionPreviewCss = (suggestion: CatalogueStyleSuggestion): string => {
  if (suggestion.kind === 'categories') {
    const colors = suggestion.categories.map(c => c.color);
    if (colors.length === 0) return 'transparent';
    const size = 100 / colors.length;
    const stops = colors
      .map((color, i) => `${color} ${i * size}%, ${color} ${(i + 1) * size}%`)
      .join(', ');
    return `linear-gradient(to right, ${stops})`;
  }
  if (suggestion.kind === 'gradient') {
    return `linear-gradient(to right, ${suggestion.startColor}, ${suggestion.endColor})`;
  }
  const colors = generateColorRamp(suggestion.colormap.name, 20, suggestion.colormap.reverse);
  return `linear-gradient(to right, ${colors
    .map((c, i) => `rgb(${c[0]}, ${c[1]}, ${c[2]}) ${(i / 19) * 100}%`)
    .join(', ')})`;
};
