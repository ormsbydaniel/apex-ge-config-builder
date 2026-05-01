/**
 * Editor-side data model for the OpenLayers flat-style vector style array.
 *
 * Each saved entry follows OL's rule shape:
 *   { filter?, else?, style: { ...flat properties... } }
 *
 * The structured editor works in this richer model and round-trips with raw
 * JSON via `toFlatStyleArray` / `fromFlatStyleArray`.
 */

// ----- Value model (per-property) ---------------------------------------------------

export type Stop<T = string | number | boolean | number[]> = {
  input: number;
  value: T;
};

export type AttributeStop<T = string | number | boolean | number[]> = {
  /** Match key for 'match' mode, or numeric stop input for 'interpolate' mode */
  key: string | number;
  value: T;
};

export type ConstantValue = string | number | boolean | number[];

export type ValueModel =
  | { kind: 'constant'; value: ConstantValue }
  | {
      kind: 'attribute';
      field: string;
      mode: 'match';
      stops: AttributeStop[];
      default?: ConstantValue;
    }
  | {
      kind: 'attribute';
      field: string;
      mode: 'interpolate';
      interpolation?: 'linear' | { type: 'exponential'; base: number };
      stops: Stop[];
    }
  | {
      kind: 'zoom';
      mode: 'interpolate';
      interpolation?: 'linear' | { type: 'exponential'; base: number };
      stops: Stop[];
    }
  | { kind: 'expression'; raw: unknown };

// ----- Filter model -----------------------------------------------------------------

export type FilterOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'in'
  | 'not in'
  | 'has';

export interface FilterClause {
  /** Attribute field name, or the literal string 'zoom' for the zoom pseudo-field */
  field: string;
  isZoom?: boolean;
  op: FilterOperator;
  /**
   * Comparison value. For 'in' / 'not in' this is an array. For 'has' it's
   * unused (presence check on the field).
   */
  value?: ConstantValue | ConstantValue[];
}

export type FilterModel =
  | { kind: 'simple'; combinator: 'all' | 'any'; clauses: FilterClause[] }
  | { kind: 'expression'; raw: unknown };

// ----- Drawing primitives -----------------------------------------------------------

export type MarkerSubMode = 'circle' | 'icon' | 'shape';

export interface MarkerPrimitive {
  subMode: MarkerSubMode;
  /** Property name -> value model. Property names are the OL-spec keys (e.g. 'circle-radius'). */
  props: Record<string, ValueModel>;
}

export interface SimplePrimitive {
  props: Record<string, ValueModel>;
}

export type LinePrimitive = SimplePrimitive;
export type FillPrimitive = SimplePrimitive;
export type LabelPrimitive = SimplePrimitive;

export interface RulePrimitives {
  marker?: MarkerPrimitive;
  line?: LinePrimitive;
  fill?: FillPrimitive;
  label?: LabelPrimitive;
}

// ----- Style rule -------------------------------------------------------------------

export interface StyleRule {
  /** Editor-only label, persisted as `_name` extension key in JSON output. */
  name?: string;
  /** Disabled rules are omitted from the serialised output. */
  enabled?: boolean;
  filter?: FilterModel;
  /** Marks this rule as the OL `else: true` branch (mutually exclusive with filter). */
  else?: boolean;
  primitives: RulePrimitives;
}

// ----- Parse result -----------------------------------------------------------------

export interface ParseFallback {
  ruleIndex: number;
  /** Property name, or undefined if the whole rule fell back. */
  property?: string;
  reason: string;
}

export interface ParseResult {
  rules: StyleRule[];
  fallbacks: ParseFallback[];
}
