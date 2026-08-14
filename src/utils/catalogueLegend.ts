/**
 * Converts catalogue legend definitions (from a catalogue collection JSON) into
 * the builder's own styling structures: categories, named colormaps, or a
 * truthful two-stop gradient fallback.
 */

import { CatalogueLegend, CatalogueLegendEntry, CatalogueLayer } from '@/types/service';
import { Category, Colormap } from '@/types/category';
import { COLORMAP_DATA } from '@/constants/colormapData';
import { generateColorRamp } from '@/utils/colormapUtils';
import { resolveColormapName } from '@/utils/colormapNameMapping';


export interface CategoriesSuggestion {
  kind: 'categories';
  categories: Category[];
  units?: string;
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

export type CatalogueStyleSuggestion =
  | CategoriesSuggestion
  | ColormapSuggestion
  | GradientSuggestion;

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
    return { kind: 'categories', categories: legendToCategories(legend), units };
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

/** One-line description of what will be applied when the layer is added. */
export const describeStyleSuggestion = (suggestion: CatalogueStyleSuggestion): string => {
  switch (suggestion.kind) {
    case 'categories':
      return `Categories: ${suggestion.categories.length} class${suggestion.categories.length !== 1 ? 'es' : ''}`;
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
