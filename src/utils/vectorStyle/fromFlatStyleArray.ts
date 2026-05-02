/**
 * Parse an OpenLayers flat-style array into the editor's structured model.
 *
 * Best-effort: unknown property values become `{ kind: 'expression', raw }` so
 * nothing is lost. Whole rules whose `style` is not a plain object fall back
 * to a single-rule expression-mode model.
 */

import {
  ALL_PROP_DEFS,
  PRIMITIVE_PREFIXES,
  propertyPrimitive,
} from './propertyCatalogues';
import type {
  ParseResult,
  StyleRule,
  RulePrimitives,
  ValueModel,
  AttributeStop,
  Stop,
  ParseFallback,
  MarkerSubMode,
} from '@/types/vectorStyle';
import { expressionToFilterModel } from './filterCompiler';

const isObj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const isArr = (x: unknown): x is unknown[] => Array.isArray(x);

const parseInterpolation = (
  expr: unknown,
): 'linear' | { type: 'exponential'; base: number } | undefined => {
  if (!isArr(expr)) return undefined;
  if (expr[0] === 'linear') return 'linear';
  if (expr[0] === 'exponential' && typeof expr[1] === 'number') {
    return { type: 'exponential', base: expr[1] };
  }
  return undefined;
};

const expressionToValue = (raw: unknown): ValueModel => {
  // Constants
  if (
    typeof raw === 'string' ||
    typeof raw === 'number' ||
    typeof raw === 'boolean'
  ) {
    return { kind: 'constant', value: raw };
  }
  if (isArr(raw) && raw.every(v => typeof v === 'number')) {
    return { kind: 'constant', value: raw as number[] };
  }
  if (!isArr(raw)) {
    return { kind: 'expression', raw };
  }

  // ['get', field]
  if (raw[0] === 'get' && raw.length === 2 && typeof raw[1] === 'string') {
    return { kind: 'attribute', field: raw[1], mode: 'direct' };
  }

  // ['interpolate', <interp>, <input>, ...stops]
  if (raw[0] === 'interpolate' && raw.length >= 5) {
    const interp = parseInterpolation(raw[1]);
    const input = raw[2];
    const stopsArr = raw.slice(3);
    if (stopsArr.length % 2 !== 0 || !interp) {
      return { kind: 'expression', raw };
    }
    const stops: Stop[] = [];
    for (let i = 0; i < stopsArr.length; i += 2) {
      const k = stopsArr[i];
      const v = stopsArr[i + 1];
      if (typeof k !== 'number') return { kind: 'expression', raw };
      stops.push({
        input: k,
        value: v as Stop['value'],
      });
    }

    if (isArr(input) && input[0] === 'zoom') {
      return { kind: 'zoom', mode: 'interpolate', interpolation: interp, stops };
    }
    if (isArr(input) && input[0] === 'get' && typeof input[1] === 'string') {
      return {
        kind: 'attribute',
        field: input[1],
        mode: 'interpolate',
        interpolation: interp,
        stops,
      };
    }
    return { kind: 'expression', raw };
  }

  // ['match', ['get', field], k1, v1, ..., default]
  if (raw[0] === 'match' && raw.length >= 4) {
    const input = raw[1];
    if (!isArr(input) || input[0] !== 'get' || typeof input[1] !== 'string') {
      return { kind: 'expression', raw };
    }
    const tail = raw.slice(2);
    // Last item is default; preceding pairs are key/value.
    if (tail.length < 1 || (tail.length - 1) % 2 !== 0) {
      return { kind: 'expression', raw };
    }
    const def = tail[tail.length - 1];
    const pairs = tail.slice(0, -1);
    const stops: AttributeStop[] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const k = pairs[i];
      if (typeof k !== 'string' && typeof k !== 'number') {
        return { kind: 'expression', raw };
      }
      stops.push({ key: k, value: pairs[i + 1] as AttributeStop['value'] });
    }
    return {
      kind: 'attribute',
      field: input[1],
      mode: 'match',
      stops,
      default: def as AttributeStop['value'] | undefined,
    };
  }

  // Anything else — preserve as expression.
  return { kind: 'expression', raw };
};

const KNOWN_PROP_KEYS = new Set(ALL_PROP_DEFS.map(d => d.key));

const guessMarkerSubMode = (props: Record<string, unknown>): MarkerSubMode => {
  if (Object.keys(props).some(k => k.startsWith('icon-'))) return 'icon';
  if (Object.keys(props).some(k => k.startsWith('shape-'))) return 'shape';
  return 'circle';
};

const parseStyleObject = (
  styleObj: Record<string, unknown>,
  ruleIndex: number,
  fallbacks: ParseFallback[],
): { primitives: RulePrimitives; name?: string } => {
  const buckets: Record<keyof typeof PRIMITIVE_PREFIXES, Record<string, unknown>> = {
    fill: {},
    line: {},
    marker: {},
    label: {},
  };
  let name: string | undefined;

  for (const [key, raw] of Object.entries(styleObj)) {
    if (key === '_name' && typeof raw === 'string') {
      name = raw;
      continue;
    }
    const bucket = propertyPrimitive(key);
    if (!bucket) {
      fallbacks.push({
        ruleIndex,
        property: key,
        reason: `Unknown style property "${key}"; preserved as expression`,
      });
      continue;
    }
    if (!KNOWN_PROP_KEYS.has(key)) {
      fallbacks.push({
        ruleIndex,
        property: key,
        reason: `Property "${key}" is not editable in the structured form`,
      });
    }
    buckets[bucket][key] = raw;
  }

  const primitives: RulePrimitives = {};

  if (Object.keys(buckets.fill).length) {
    primitives.fill = {
      props: Object.fromEntries(
        Object.entries(buckets.fill).map(([k, v]) => [k, expressionToValue(v)]),
      ),
    };
  }
  if (Object.keys(buckets.line).length) {
    primitives.line = {
      props: Object.fromEntries(
        Object.entries(buckets.line).map(([k, v]) => [k, expressionToValue(v)]),
      ),
    };
  }
  if (Object.keys(buckets.marker).length) {
    primitives.marker = {
      subMode: guessMarkerSubMode(buckets.marker),
      props: Object.fromEntries(
        Object.entries(buckets.marker).map(([k, v]) => [k, expressionToValue(v)]),
      ),
    };
  }
  if (Object.keys(buckets.label).length) {
    primitives.label = {
      props: Object.fromEntries(
        Object.entries(buckets.label).map(([k, v]) => [k, expressionToValue(v)]),
      ),
    };
  }

  return { primitives, name };
};

const blankRule = (): StyleRule => ({ enabled: true, primitives: {} });

export const fromFlatStyleArray = (arr: unknown): ParseResult => {
  const fallbacks: ParseFallback[] = [];
  if (!isArr(arr)) {
    return { rules: [], fallbacks };
  }

  const rules: StyleRule[] = [];

  arr.forEach((entry, idx) => {
    // Bare style object form: { 'fill-color': ... }
    if (isObj(entry) && !('style' in entry) && !('filter' in entry) && !('else' in entry)) {
      const { primitives, name } = parseStyleObject(entry, idx, fallbacks);
      rules.push({ enabled: true, primitives, ...(name ? { name } : {}) });
      return;
    }

    // Rule wrapper form
    if (isObj(entry) && isObj(entry.style)) {
      const { primitives, name } = parseStyleObject(
        entry.style as Record<string, unknown>,
        idx,
        fallbacks,
      );
      const rule: StyleRule = { enabled: true, primitives, ...(name ? { name } : {}) };
      if (entry.else === true) {
        rule.else = true;
      } else if (entry.filter !== undefined) {
        rule.filter = expressionToFilterModel(entry.filter);
        if (rule.filter?.kind === 'expression') {
          fallbacks.push({
            ruleIndex: idx,
            reason: 'Filter expression opened in advanced mode',
          });
        }
      }
      rules.push(rule);
      return;
    }

    // Anything else — opaque rule
    const rule = blankRule();
    rule.filter = { kind: 'expression', raw: entry };
    rules.push(rule);
    fallbacks.push({
      ruleIndex: idx,
      reason: 'Rule entry not recognised; opened in expression mode',
    });
  });

  return { rules, fallbacks };
};
