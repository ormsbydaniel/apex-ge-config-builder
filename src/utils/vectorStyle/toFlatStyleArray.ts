/**
 * Serialise the editor's structured `StyleRule[]` into an OpenLayers flat-style
 * array suitable for use as a vector source's `style` property.
 *
 * Disabled rules are omitted. Editor-only `name` is persisted as `_name` (an
 * extension key OL ignores) so the JSON round-trips back to the editor.
 */

import type {
  StyleRule,
  ValueModel,
  RulePrimitives,
  AttributeStop,
  Stop,
} from '@/types/vectorStyle';
import { filterModelToExpression } from './filterCompiler';

const valueToExpression = (v: ValueModel): unknown => {
  switch (v.kind) {
    case 'constant':
      return v.value;

    case 'expression':
      return v.raw;

    case 'zoom': {
      const interp = serialiseInterpolation(v.interpolation);
      const flatStops = (v.stops as Stop[]).flatMap(s => [s.input, s.value]);
      return ['interpolate', interp, ['zoom'], ...flatStops];
    }

    case 'attribute': {
      if (v.mode === 'direct') {
        return ['get', v.field];
      }
      if (v.mode === 'match') {
        const flatStops = (v.stops as AttributeStop[]).flatMap(s => [s.key, s.value]);
        const def = v.default !== undefined ? [v.default] : [getMatchFallback(v)];
        return ['match', ['get', v.field], ...flatStops, ...def];
      }
      // interpolate
      const interp = serialiseInterpolation(v.interpolation);
      const flatStops = (v.stops as Stop[]).flatMap(s => [s.input, s.value]);
      return ['interpolate', interp, ['get', v.field], ...flatStops];
    }
  }
};

const serialiseInterpolation = (
  i: { type: 'exponential'; base: number } | 'linear' | undefined,
): unknown => {
  if (!i || i === 'linear') return ['linear'];
  return ['exponential', i.base];
};

const getMatchFallback = (v: Extract<ValueModel, { kind: 'attribute'; mode: 'match' }>): unknown => {
  // OL `match` requires a default. Pick a benign one based on the first stop's value type.
  const first = v.stops[0]?.value;
  if (typeof first === 'number') return 0;
  if (typeof first === 'boolean') return false;
  if (Array.isArray(first)) return [];
  return '';
};

const serialisePrimitives = (primitives: RulePrimitives): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  const writeProps = (props: Record<string, ValueModel>) => {
    for (const [key, value] of Object.entries(props)) {
      out[key] = valueToExpression(value);
    }
  };
  if (primitives.fill) writeProps(primitives.fill.props);
  if (primitives.line) writeProps(primitives.line.props);
  if (primitives.marker) writeProps(primitives.marker.props);
  if (primitives.label) writeProps(primitives.label.props);
  return out;
};

export const toFlatStyleArray = (rules: StyleRule[]): unknown[] => {
  const out: unknown[] = [];

  for (const rule of rules) {
    if (rule.enabled === false) continue;

    const styleObj = serialisePrimitives(rule.primitives);
    if (rule.name) {
      (styleObj as Record<string, unknown>)._name = rule.name;
    }

    const filterExpr = rule.else ? undefined : filterModelToExpression(rule.filter);
    const hasFilter = filterExpr !== undefined;
    const isElse = !!rule.else;

    if (!hasFilter && !isElse) {
      // Bare style — OL accepts the style object directly as an array entry.
      out.push(styleObj);
    } else {
      const entry: Record<string, unknown> = { style: styleObj };
      if (hasFilter) entry.filter = filterExpr;
      if (isElse) entry.else = true;
      out.push(entry);
    }
  }

  return out;
};
