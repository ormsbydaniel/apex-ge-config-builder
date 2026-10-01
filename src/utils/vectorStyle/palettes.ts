/**
 * Colour palettes used by the vector styling recipes.
 *
 * Categorical palettes supply discrete, visually distinct swatches for
 * unique-value styling. Sequential/diverging ramps supply ordered stops for
 * graduated (choropleth) styling.
 */

export interface CategoricalPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface RampPalette {
  id: string;
  name: string;
  /** Ordered from low to high. */
  colors: string[];
  diverging?: boolean;
}

export const CATEGORICAL_PALETTES: CategoricalPalette[] = [
  {
    id: 'tableau10',
    name: 'Tableau 10',
    colors: [
      '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
      '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
    ],
  },
  {
    id: 'set2',
    name: 'Soft (Set 2)',
    colors: [
      '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854',
      '#ffd92f', '#e5c494', '#b3b3b3',
    ],
  },
  {
    id: 'dark2',
    name: 'Bold (Dark 2)',
    colors: [
      '#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e',
      '#e6ab02', '#a6761d', '#666666',
    ],
  },
  {
    id: 'landcover',
    name: 'Land cover',
    colors: [
      '#1f8a3b', '#a8d08d', '#f0e68c', '#d2b48c', '#c0392b',
      '#7f8c8d', '#2980b9', '#ecf0f1', '#8e44ad', '#16a085',
    ],
  },
];

export const RAMP_PALETTES: RampPalette[] = [
  { id: 'viridis', name: 'Viridis', colors: ['#440154', '#3b528b', '#21908c', '#5dc863', '#fde725'] },
  { id: 'blues', name: 'Blues', colors: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'] },
  { id: 'greens', name: 'Greens', colors: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'] },
  { id: 'oranges', name: 'Oranges', colors: ['#feedde', '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'] },
  { id: 'magma', name: 'Magma', colors: ['#000004', '#51127c', '#b63679', '#fb8861', '#fcfdbf'] },
  {
    id: 'rdylbu',
    name: 'Red–Yellow–Blue',
    colors: ['#d73027', '#fc8d59', '#fee090', '#91bfdb', '#4575b4'],
    diverging: true,
  },
  {
    id: 'rdbu',
    name: 'Red–Blue',
    colors: ['#b2182b', '#ef8a62', '#f7f7f7', '#67a9cf', '#2166ac'],
    diverging: true,
  },
];

export const DEFAULT_CATEGORICAL_PALETTE = CATEGORICAL_PALETTES[0];
export const DEFAULT_RAMP_PALETTE = RAMP_PALETTES[0];

export const getCategoricalPalette = (id: string): CategoricalPalette =>
  CATEGORICAL_PALETTES.find(p => p.id === id) ?? DEFAULT_CATEGORICAL_PALETTE;

export const getRampPalette = (id: string): RampPalette =>
  RAMP_PALETTES.find(p => p.id === id) ?? DEFAULT_RAMP_PALETTE;

/** Cycle palette colours so any number of categories gets a swatch. */
export const assignCategoricalColors = (count: number, paletteId?: string, reverse = false): string[] => {
  const base = getCategoricalPalette(paletteId ?? DEFAULT_CATEGORICAL_PALETTE.id).colors;
  const colors = reverse ? [...base].reverse() : base;
  return Array.from({ length: Math.max(0, count) }, (_, i) => colors[i % colors.length]);
};

const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map(v => clampByte(v).toString(16).padStart(2, '0')).join('')}`;

/** Linear interpolation between two hex colours. */
export const mixHex = (from: string, to: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
};

/**
 * Resample a ramp palette to exactly `count` colours, interpolating between
 * the palette's control points.
 */
export const sampleRamp = (count: number, paletteId?: string, reverse = false): string[] => {
  const base = getRampPalette(paletteId ?? DEFAULT_RAMP_PALETTE.id).colors;
  const colors = reverse ? [...base].reverse() : base;
  if (count <= 0) return [];
  if (count === 1) return [colors[Math.floor(colors.length / 2)]];

  return Array.from({ length: count }, (_, i) => {
    const pos = (i / (count - 1)) * (colors.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.min(colors.length - 1, lower + 1);
    return mixHex(colors[lower], colors[upper], pos - lower);
  });
};

/** Add an alpha channel to a hex colour, producing an `rgba(...)` string. */
export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
