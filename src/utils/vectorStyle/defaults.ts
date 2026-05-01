/**
 * Sensible defaults for newly-added drawing primitives.
 */

import type {
  FillPrimitive,
  LinePrimitive,
  LabelPrimitive,
  MarkerPrimitive,
  ValueModel,
} from '@/types/vectorStyle';

const constant = (value: string | number | boolean | number[]): ValueModel => ({
  kind: 'constant',
  value,
});

export const defaultMarker = (): MarkerPrimitive => ({
  subMode: 'circle',
  props: {
    'circle-radius': constant(5),
    'circle-fill-color': constant('#3b82f6'),
    'circle-stroke-color': constant('#ffffff'),
    'circle-stroke-width': constant(1),
  },
});

export const defaultLine = (): LinePrimitive => ({
  props: {
    'stroke-color': constant('#3b82f6'),
    'stroke-width': constant(2),
  },
});

export const defaultFill = (): FillPrimitive => ({
  props: {
    'fill-color': constant('rgba(59, 130, 246, 0.4)'),
  },
});

export const defaultLabel = (firstStringField?: string): LabelPrimitive => ({
  props: {
    'text-value': firstStringField
      ? { kind: 'attribute', field: firstStringField, mode: 'match', stops: [] }
      : constant(''),
    'text-font': constant('12px sans-serif'),
    'text-fill-color': constant('#ffffff'),
    'text-stroke-color': constant('#374151'),
    'text-stroke-width': constant(2),
  },
});
