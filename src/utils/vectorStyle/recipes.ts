/**
 * Intent-first styling recipes.
 *
 * Each recipe is a pure function that turns a small intent description into
 * standard `StyleRule[]` entries — the same model the structured editor and
 * `toFlatStyleArray` already use. Recipes never introduce a new persistence
 * format; they simply scaffold rules the user then refines.
 */

import type {
  AttributeStop,
  ConstantValue,
  FilterModel,
  FilterOperator,
  RulePrimitives,
  Stop,
  StyleRule,
  ValueModel,
} from '@/types/vectorStyle';
import { assignCategoricalColors, sampleRamp, withAlpha } from './palettes';
import { equalIntervalBreaks, quantileBreaks } from './sampleSourceData';

export type RecipeId =
  | 'categorized'
  | 'graduated'
  | 'uniform'
  | 'labels'
  | 'highlight';

export type GeometryTarget = 'polygon' | 'line' | 'point';

export type UniformLineStyle = 'solid' | 'dashed' | 'dotted' | 'dash-dot' | 'long-dash';

export const UNIFORM_LINE_STYLES: { id: UniformLineStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'dash-dot', label: 'Dash-dot' },
  { id: 'long-dash', label: 'Long dash' },
];

export const UNIFORM_LINE_WEIGHTS = [1, 2, 3, 4, 6] as const;

export type UniformFillStyle = 'solid' | 'hatch' | 'cross-hatch';

export const UNIFORM_FILL_STYLES: { id: UniformFillStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'hatch', label: 'Hatch' },
  { id: 'cross-hatch', label: 'Cross hatch' },
];

export interface RecipeDefinition {
  id: RecipeId;
  name: string;
  description: string;
  /** Field kind the recipe needs, if any. */
  requires?: 'category' | 'number' | 'any';
}

export const RECIPES: RecipeDefinition[] = [
  {
    id: 'uniform',
    name: 'Simple uniform',
    description: 'One clean fill, outline or marker for every feature.',
  },
  {
    id: 'categorized',
    name: 'Categorised',
    description: 'Colour features by the unique values of a text attribute.',
    requires: 'category',
  },
  {
    id: 'graduated',
    name: 'Graduated',
    description: 'Colour features along a ramp using a numeric attribute.',
    requires: 'number',
  },
  {
    id: 'labels',
    name: 'Feature labels',
    description: 'Show a text label from an attribute, with a halo and offset.',
    requires: 'any',
  },
  {
    id: 'highlight',
    name: 'Filter / highlight',
    description: 'Pick out the features that match a condition.',
    requires: 'any',
  },
];

export const getRecipe = (id: RecipeId): RecipeDefinition | undefined =>
  RECIPES.find(r => r.id === id);

// ----- helpers ----------------------------------------------------------------------

const constant = (value: ConstantValue): ValueModel => ({ kind: 'constant', value });

const DEFAULT_FILL_ALPHA = 0.6;
const DEFAULT_OUTLINE = '#ffffff';
const DEFAULT_FALLBACK = '#9ca3af';

const lineStyleProps = (
  style: UniformLineStyle,
  width: number,
): Record<string, ValueModel> => {
  if (style === 'solid') return {};

  const patterns: Record<Exclude<UniformLineStyle, 'solid'>, number[]> = {
    dashed: [4 * width, 2 * width],
    dotted: [width, 2 * width],
    'dash-dot': [4 * width, 2 * width, width, 2 * width],
    'long-dash': [8 * width, 3 * width],
  };

  return {
    'stroke-line-dash': constant(patterns[style]),
    ...(style === 'dotted' ? { 'stroke-line-cap': constant('round') } : {}),
  };
};

/**
 * Fill patterns are small repeating SVG tiles (transparent background, black
 * strokes) that OpenLayers loads via `fill-pattern-*` and tints with
 * `fill-color`. Tiles must stay black-on-transparent: the tint multiplies the
 * tile's colour, so any other ink would resist recolouring.
 */
const FILL_PATTERN_TILES: Record<Exclude<UniformFillStyle, 'solid'>, string> = {
  hatch:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M-1 1 L1 -1 M0 8 L8 0 M7 9 L9 7' stroke='%23000000' stroke-width='1' fill='none'/%3E%3C/svg%3E",
  'cross-hatch':
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M-1 1 L1 -1 M0 8 L8 0 M7 9 L9 7 M-1 -1 L1 1 M0 0 L8 8 M7 -1 L9 1' stroke='%23000000' stroke-width='1' fill='none'/%3E%3C/svg%3E",
};

const fillStyleProps = (style: UniformFillStyle): Record<string, ValueModel> => {
  if (style === 'solid') return {};
  return {
    'fill-pattern-src': constant(FILL_PATTERN_TILES[style]),
    'fill-pattern-size': constant([8, 8]),
    'fill-pattern-offset': constant([0, 0]),
  };
};

/** Build primitives that colour the given geometry target. */
const colouredPrimitives = (
  geometry: GeometryTarget,
  color: ValueModel,
  options: {
    outlineColor?: string;
    outlineWidth?: number;
    radius?: number;
    lineStyle?: UniformLineStyle;
    fillStyle?: UniformFillStyle;
  } = {},
): RulePrimitives => {
  const outlineColor = options.outlineColor ?? DEFAULT_OUTLINE;
  const outlineWidth = options.outlineWidth ?? 1;

  if (geometry === 'line') {
    return {
      line: {
        props: {
          'stroke-color': color,
          'stroke-width': constant(options.outlineWidth ?? 2),
          ...lineStyleProps(options.lineStyle ?? 'solid', options.outlineWidth ?? 2),
        },
      },
    };
  }

  if (geometry === 'point') {
    return {
      marker: {
        subMode: 'circle',
        props: {
          'circle-radius': constant(options.radius ?? 6),
          'circle-fill-color': color,
          'circle-stroke-color': constant(outlineColor),
          'circle-stroke-width': constant(outlineWidth),
        },
      },
    };
  }

  return {
    fill: {
      props: {
        'fill-color': color,
        ...fillStyleProps(options.fillStyle ?? 'solid'),
      },
    },
    line: {
      props: {
        'stroke-color': constant(outlineColor),
        'stroke-width': constant(outlineWidth),
      },
    },
  };
};

// ----- Categorised ------------------------------------------------------------------

export interface CategoryAssignment {
  value: string;
  color: string;
}

export interface CategorizedRecipeInput {
  field: string;
  /** Unique values to colour. Colours are auto-assigned when omitted. */
  categories: Array<string | CategoryAssignment>;
  geometry: GeometryTarget;
  paletteId?: string;
  /** Reverse the palette colour order. */
  reversePalette?: boolean;
  /** Colour for features that match none of the categories. */
  fallbackColor?: string;
  /** Apply transparency to polygon fills (ignored for lines/points). */
  fillAlpha?: number;
  ruleName?: string;
}

export const resolveCategoryColors = (
  categories: Array<string | CategoryAssignment>,
  paletteId?: string,
  reverse = false,
): CategoryAssignment[] => {
  const palette = assignCategoricalColors(categories.length, paletteId, reverse);
  return categories.map((entry, index) =>
    typeof entry === 'string'
      ? { value: entry, color: palette[index] }
      : { value: entry.value, color: entry.color || palette[index] },
  );
};

export const buildCategorizedRecipe = (input: CategorizedRecipeInput): StyleRule[] => {
  const assignments = resolveCategoryColors(input.categories, input.paletteId, input.reversePalette);
  const alpha = input.geometry === 'polygon' ? input.fillAlpha ?? DEFAULT_FILL_ALPHA : 1;
  const paint = (hex: string) => (alpha >= 1 ? hex : withAlpha(hex, alpha));

  const stops: AttributeStop[] = assignments.map(({ value, color }) => ({
    key: value,
    value: paint(color),
  }));

  const color: ValueModel = {
    kind: 'attribute',
    field: input.field,
    mode: 'match',
    stops,
    default: paint(input.fallbackColor ?? DEFAULT_FALLBACK),
  };

  return [
    {
      name: input.ruleName ?? `Categorised by ${input.field}`,
      enabled: true,
      primitives: colouredPrimitives(input.geometry, color),
    },
  ];
};

// ----- Graduated / choropleth -------------------------------------------------------

export type ClassificationMethod = 'equal-interval' | 'quantile';

export interface GraduatedRecipeInput {
  field: string;
  geometry: GeometryTarget;
  classes: number;
  /** Observed range; required for equal-interval classification. */
  min?: number;
  max?: number;
  /** Observed values; required for quantile classification. */
  values?: number[];
  method?: ClassificationMethod;
  paletteId?: string;
  /** Reverse the palette colour order. */
  reversePalette?: boolean;
  fillAlpha?: number;
  ruleName?: string;
}

export const buildGraduatedRecipe = (input: GraduatedRecipeInput): StyleRule[] => {
  const method = input.method ?? 'equal-interval';
  const classes = Math.max(2, Math.floor(input.classes));

  const breaks =
    method === 'quantile' && input.values?.length
      ? quantileBreaks(input.values, classes)
      : equalIntervalBreaks(input.min ?? 0, input.max ?? 1, classes);

  const alpha = input.geometry === 'polygon' ? input.fillAlpha ?? DEFAULT_FILL_ALPHA : 1;
  const ramp = sampleRamp(breaks.length, input.paletteId, input.reversePalette);

  const stops: Stop[] = breaks.map((breakInput, index) => ({
    input: breakInput,
    value: alpha >= 1 ? ramp[index] : withAlpha(ramp[index], alpha),
  }));

  const color: ValueModel = {
    kind: 'attribute',
    field: input.field,
    mode: 'interpolate',
    interpolation: 'linear',
    stops,
  };

  return [
    {
      name: input.ruleName ?? `Graduated by ${input.field}`,
      enabled: true,
      primitives: colouredPrimitives(input.geometry, color),
    },
  ];
};

// ----- Simple uniform ---------------------------------------------------------------

export interface UniformRecipeInput {
  geometry: GeometryTarget;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  lineStyle?: UniformLineStyle;
  radius?: number;
  fillAlpha?: number;
  ruleName?: string;
}

const UNIFORM_LINE_STYLE_NAMES: Record<UniformLineStyle, string> = {
  solid: 'Solid line',
  dashed: 'Dashed line',
  dotted: 'Dotted line',
  'dash-dot': 'Dash-dot line',
  'long-dash': 'Long dash line',
};

/** Describe what the user picked, so the rule list reads like the cartography. */
export const uniformRuleName = (input: UniformRecipeInput): string => {
  if (input.geometry === 'line') return UNIFORM_LINE_STYLE_NAMES[input.lineStyle ?? 'solid'];
  if (input.geometry === 'point') return 'Point marker';
  return 'Fill and outline';
};

export const buildUniformRecipe = (input: UniformRecipeInput): StyleRule[] => {
  const base = input.color ?? '#3b82f6';
  const alpha = input.geometry === 'polygon' ? input.fillAlpha ?? DEFAULT_FILL_ALPHA : 1;
  const color = constant(alpha >= 1 ? base : withAlpha(base, alpha));

  return [
    {
      name: input.ruleName ?? uniformRuleName(input),
      enabled: true,
      primitives: colouredPrimitives(input.geometry, color, {
        outlineColor: input.outlineColor,
        outlineWidth: input.outlineWidth,
        lineStyle: input.lineStyle,
        radius: input.radius,
      }),
    },
  ];
};

// ----- Feature labels ---------------------------------------------------------------

export interface LabelRecipeInput {
  field: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  haloColor?: string;
  haloWidth?: number;
  offsetY?: number;
  placement?: 'point' | 'line';
  ruleName?: string;
}

export const buildLabelRecipe = (input: LabelRecipeInput): StyleRule[] => {
  const size = input.fontSize ?? 12;
  const family = input.fontFamily ?? 'sans-serif';

  const props: Record<string, ValueModel> = {
    'text-value': { kind: 'expression', raw: ['get', input.field] },
    'text-font': constant(`${size}px ${family}`),
    'text-fill-color': constant(input.color ?? '#ffffff'),
    'text-stroke-color': constant(input.haloColor ?? '#374151'),
    'text-stroke-width': constant(input.haloWidth ?? 2),
  };

  if (input.offsetY !== undefined) props['text-offset-y'] = constant(input.offsetY);
  if (input.placement) props['text-placement'] = constant(input.placement);

  return [
    {
      name: input.ruleName ?? `Labels from ${input.field}`,
      enabled: true,
      primitives: { label: { props } },
    },
  ];
};

// ----- Filter / highlight -----------------------------------------------------------

export interface HighlightRecipeInput {
  field: string;
  op: FilterOperator;
  value?: ConstantValue | ConstantValue[];
  geometry: GeometryTarget;
  highlightColor?: string;
  /** Colour for everything else; omit to leave non-matching features unstyled. */
  baseColor?: string;
  fillAlpha?: number;
  ruleName?: string;
}

export const buildHighlightRecipe = (input: HighlightRecipeInput): StyleRule[] => {
  const alpha = input.geometry === 'polygon' ? input.fillAlpha ?? DEFAULT_FILL_ALPHA : 1;
  const paint = (hex: string) => (alpha >= 1 ? hex : withAlpha(hex, alpha));

  const filter: FilterModel = {
    kind: 'simple',
    combinator: 'all',
    clauses: [{ field: input.field, op: input.op, value: input.value }],
  };

  const rules: StyleRule[] = [
    {
      name: input.ruleName ?? `Highlight ${input.field}`,
      enabled: true,
      filter,
      primitives: colouredPrimitives(
        input.geometry,
        constant(paint(input.highlightColor ?? '#e11d48')),
        { outlineColor: '#ffffff', outlineWidth: 2 },
      ),
    },
  ];

  if (input.baseColor) {
    rules.push({
      name: 'Everything else',
      enabled: true,
      else: true,
      primitives: colouredPrimitives(input.geometry, constant(paint(input.baseColor)), {
        outlineColor: '#d1d5db',
      }),
    });
  }

  return rules;
};

// ----- Application ------------------------------------------------------------------

export type RecipeApplyMode = 'replace' | 'append';

/**
 * Merge recipe-generated rules into an existing rule list.
 * `replace` discards existing rules; `append` keeps them and adds the new ones.
 * Any `else` rule is kept last, as OpenLayers evaluates it as the fallback.
 */
export const applyRecipeRules = (
  existing: StyleRule[],
  generated: StyleRule[],
  mode: RecipeApplyMode,
): StyleRule[] => {
  const combined = mode === 'replace' ? [...generated] : [...existing, ...generated];
  const elseRules = combined.filter(r => r.else);
  const rest = combined.filter(r => !r.else);
  // Only one else branch is meaningful; keep the last one authored.
  return elseRules.length ? [...rest, elseRules[elseRules.length - 1]] : rest;
};

export type RecipeInput =
  | ({ recipe: 'categorized' } & CategorizedRecipeInput)
  | ({ recipe: 'graduated' } & GraduatedRecipeInput)
  | ({ recipe: 'uniform' } & UniformRecipeInput)
  | ({ recipe: 'labels' } & LabelRecipeInput)
  | ({ recipe: 'highlight' } & HighlightRecipeInput);

/** Dispatch helper so the UI can call one function for any recipe. */
export const buildRecipeRules = (input: RecipeInput): StyleRule[] => {
  switch (input.recipe) {
    case 'categorized':
      return buildCategorizedRecipe(input);
    case 'graduated':
      return buildGraduatedRecipe(input);
    case 'uniform':
      return buildUniformRecipe(input);
    case 'labels':
      return buildLabelRecipe(input);
    case 'highlight':
      return buildHighlightRecipe(input);
    default:
      return [];
  }
};

/** Round a positive number up to 1, 2, 2.5 or 5 × a power of ten. */
const niceStep = (raw: number): number => {
  if (!(raw > 0) || !isFinite(raw)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / pow;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * pow;
};

const roundTo = (v: number, step: number) => {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(v.toFixed(Math.min(decimals, 12)));
};

/**
 * "Nice numbers" range (D3 / Excel axis style): widens [min, max] to round
 * values that always cover the data. Snaps to 0 when min is non-negative and
 * close to zero relative to the span.
 */
export const niceRange = (min: number, max: number, _classes = 5): { min: number; max: number; step: number } => {
  if (!isFinite(min) || !isFinite(max)) return { min, max, step: 1 };
  if (min > max) [min, max] = [max, min];
  if (min === max) {
    const step = niceStep(Math.abs(min) / 10 || 1);
    return { min: roundTo(min - step, step), max: roundTo(max + step, step), step };
  }
  const span = max - min;
  const step = niceStep(span / 10);
  let lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  if (min >= 0 && min < span * 0.2) lo = 0;
  return { min: roundTo(lo, step), max: roundTo(hi, step), step };
};
