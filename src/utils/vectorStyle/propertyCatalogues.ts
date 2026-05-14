/**
 * Property catalogues for each drawing primitive in the OpenLayers flat-style spec.
 *
 * Drives the structured editor's form rendering. Adding support for a new
 * property is a single entry here.
 */

export type PropType = 'color' | 'number' | 'string' | 'boolean' | 'numberArray';

export interface PropertyDef {
  /** OL flat-style key, e.g. 'circle-radius'. */
  key: string;
  /** Human-readable label for the form. */
  label: string;
  type: PropType;
  /** Hide behind the panel's "More options" disclosure. */
  advanced?: boolean;
  /** Optional enum values for string properties (renders as a Select). */
  options?: string[];
}

export const FILL_PROPS: PropertyDef[] = [
  { key: 'fill-color', label: 'Color', type: 'color' },
];

export const LINE_PROPS: PropertyDef[] = [
  { key: 'stroke-color', label: 'Color', type: 'color' },
  { key: 'stroke-width', label: 'Width', type: 'number' },
  { key: 'stroke-line-dash', label: 'Dash pattern', type: 'numberArray', advanced: true },
  {
    key: 'stroke-line-cap',
    label: 'Line cap',
    type: 'string',
    options: ['butt', 'round', 'square'],
    advanced: true,
  },
  {
    key: 'stroke-line-join',
    label: 'Line join',
    type: 'string',
    options: ['bevel', 'round', 'miter'],
    advanced: true,
  },
  { key: 'stroke-miter-limit', label: 'Miter limit', type: 'number', advanced: true },
];

export const CIRCLE_MARKER_PROPS: PropertyDef[] = [
  { key: 'circle-radius', label: 'Radius', type: 'number' },
  { key: 'circle-fill-color', label: 'Fill color', type: 'color' },
  { key: 'circle-stroke-color', label: 'Stroke color', type: 'color' },
  { key: 'circle-stroke-width', label: 'Stroke width', type: 'number' },
  { key: 'circle-displacement', label: 'Displacement', type: 'numberArray', advanced: true },
  { key: 'circle-rotation', label: 'Rotation (rad)', type: 'number', advanced: true },
];

export const ICON_MARKER_PROPS: PropertyDef[] = [
  { key: 'icon-src', label: 'Image URL', type: 'string' },
  { key: 'icon-scale', label: 'Scale', type: 'number' },
  { key: 'icon-rotation', label: 'Rotation (rad)', type: 'number' },
  { key: 'icon-opacity', label: 'Opacity', type: 'number' },
  { key: 'icon-anchor', label: 'Anchor', type: 'numberArray', advanced: true },
  { key: 'icon-displacement', label: 'Displacement', type: 'numberArray', advanced: true },
  { key: 'icon-color', label: 'Tint color', type: 'color', advanced: true },
];

export const SHAPE_MARKER_PROPS: PropertyDef[] = [
  { key: 'shape-points', label: 'Points', type: 'number' },
  { key: 'shape-radius', label: 'Radius', type: 'number' },
  { key: 'shape-radius2', label: 'Inner radius', type: 'number', advanced: true },
  { key: 'shape-fill-color', label: 'Fill color', type: 'color' },
  { key: 'shape-stroke-color', label: 'Stroke color', type: 'color' },
  { key: 'shape-stroke-width', label: 'Stroke width', type: 'number' },
  { key: 'shape-rotation', label: 'Rotation (rad)', type: 'number', advanced: true },
  { key: 'shape-angle', label: 'Angle (rad)', type: 'number', advanced: true },
];

export const LABEL_PROPS: PropertyDef[] = [
  { key: 'text-value', label: 'Text', type: 'string' },
  { key: 'text-font', label: 'Font', type: 'string' },
  { key: 'text-fill-color', label: 'Color', type: 'color' },
  { key: 'text-stroke-color', label: 'Halo color', type: 'color' },
  { key: 'text-stroke-width', label: 'Halo width', type: 'number' },
  {
    key: 'text-placement',
    label: 'Placement',
    type: 'string',
    options: ['point', 'line'],
    advanced: true,
  },
  { key: 'text-offset-x', label: 'Offset X', type: 'number', advanced: true },
  { key: 'text-offset-y', label: 'Offset Y', type: 'number', advanced: true },
  { key: 'text-align', label: 'Align', type: 'string', options: ['left', 'center', 'right'], advanced: true },
  { key: 'text-baseline', label: 'Baseline', type: 'string', options: ['top', 'middle', 'bottom', 'alphabetic', 'hanging'], advanced: true },
  { key: 'text-rotation', label: 'Rotation (rad)', type: 'number', advanced: true },
];

/** All known prefixes/keys we recognise as belonging to a primitive. */
export const PRIMITIVE_PREFIXES = {
  marker: ['circle-', 'icon-', 'shape-'],
  line: ['stroke-'],
  fill: ['fill-'],
  label: ['text-'],
} as const;

/** Quick lookup from a property key to its primitive bucket. */
export const propertyPrimitive = (key: string): keyof typeof PRIMITIVE_PREFIXES | undefined => {
  for (const [primitive, prefixes] of Object.entries(PRIMITIVE_PREFIXES) as [
    keyof typeof PRIMITIVE_PREFIXES,
    readonly string[],
  ][]) {
    if (prefixes.some(p => key.startsWith(p))) return primitive;
  }
  return undefined;
};

/** Lookup of all known property defs for the editor. */
export const ALL_PROP_DEFS: PropertyDef[] = [
  ...FILL_PROPS,
  ...LINE_PROPS,
  ...CIRCLE_MARKER_PROPS,
  ...ICON_MARKER_PROPS,
  ...SHAPE_MARKER_PROPS,
  ...LABEL_PROPS,
];

const propDefByKey = new Map(ALL_PROP_DEFS.map(d => [d.key, d]));

export const getPropDef = (key: string): PropertyDef | undefined => propDefByKey.get(key);
