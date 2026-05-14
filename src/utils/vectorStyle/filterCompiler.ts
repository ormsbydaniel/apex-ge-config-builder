/**
 * Compiles between the editor's `FilterModel` and OpenLayers filter expressions.
 *
 * OL filter expression shapes we care about for the simple builder:
 *   ['==', ['get', 'field'], value]
 *   ['!=' | '<' | '<=' | '>' | '>=', ['get', 'field'], value]
 *   ['in', ['get', 'field'], ['literal', [...]]]
 *   ['!', ['in', ['get', 'field'], ['literal', [...]]]]   // for "not in"
 *   ['has', ['get', 'field']] OR ['!=', ['get', 'field'], null]
 *   ['all', ...subExprs]
 *   ['any', ...subExprs]
 *
 * For the "Zoom" pseudo-field, ['get', 'field'] is replaced with ['zoom'].
 *
 * Anything that doesn't fit cleanly is preserved as { kind: 'expression', raw }.
 */

import type {
  FilterClause,
  FilterModel,
  FilterOperator,
  ConstantValue,
} from '@/types/vectorStyle';

const BINARY_OPS: FilterOperator[] = ['==', '!=', '<', '<=', '>', '>='];

const isArr = (x: unknown): x is unknown[] => Array.isArray(x);

const fieldRef = (clause: FilterClause): unknown =>
  clause.isZoom ? ['zoom'] : ['get', clause.field];

const parseFieldRef = (
  expr: unknown,
): { field: string; isZoom?: boolean } | null => {
  if (!isArr(expr)) return null;
  if (expr[0] === 'zoom') return { field: 'zoom', isZoom: true };
  if (expr[0] === 'get' && typeof expr[1] === 'string') {
    return { field: expr[1] };
  }
  return null;
};

export const filterModelToExpression = (model: FilterModel | undefined): unknown => {
  if (!model) return undefined;
  if (model.kind === 'expression') return model.raw;

  const compileClause = (c: FilterClause): unknown => {
    if (c.op === 'has') return ['has', c.field];
    if (c.op === 'in' || c.op === 'not in') {
      const arr = Array.isArray(c.value) ? c.value : [];
      const inExpr = ['in', fieldRef(c), ['literal', arr]];
      return c.op === 'not in' ? ['!', inExpr] : inExpr;
    }
    return [c.op, fieldRef(c), c.value as unknown];
  };

  if (model.clauses.length === 0) return undefined;
  if (model.clauses.length === 1) return compileClause(model.clauses[0]);
  return [model.combinator, ...model.clauses.map(compileClause)];
};

const tryParseClause = (expr: unknown): FilterClause | null => {
  if (!isArr(expr) || expr.length === 0) return null;

  // ['has', 'field']
  if (expr[0] === 'has' && typeof expr[1] === 'string') {
    return { field: expr[1], op: 'has' };
  }

  // ['!', ['in', ...]]
  if (expr[0] === '!' && isArr(expr[1]) && expr[1][0] === 'in') {
    const inner = tryParseClause(expr[1]);
    if (inner && inner.op === 'in') return { ...inner, op: 'not in' };
    return null;
  }

  // ['in', <fieldRef>, ['literal', [...]]]
  if (expr[0] === 'in' && expr.length === 3) {
    const ref = parseFieldRef(expr[1]);
    if (!ref) return null;
    const litExpr = expr[2];
    let values: ConstantValue[] = [];
    if (isArr(litExpr) && litExpr[0] === 'literal' && isArr(litExpr[1])) {
      values = litExpr[1] as ConstantValue[];
    } else if (isArr(litExpr)) {
      values = litExpr as ConstantValue[];
    } else {
      return null;
    }
    return { field: ref.field, isZoom: ref.isZoom, op: 'in', value: values };
  }

  // Binary ops
  if (typeof expr[0] === 'string' && BINARY_OPS.includes(expr[0] as FilterOperator) && expr.length === 3) {
    const ref = parseFieldRef(expr[1]);
    if (!ref) return null;
    return {
      field: ref.field,
      isZoom: ref.isZoom,
      op: expr[0] as FilterOperator,
      value: expr[2] as ConstantValue,
    };
  }

  return null;
};

export const expressionToFilterModel = (expr: unknown): FilterModel | undefined => {
  if (expr === undefined || expr === null) return undefined;

  if (isArr(expr) && (expr[0] === 'all' || expr[0] === 'any')) {
    const combinator = expr[0] as 'all' | 'any';
    const clauses: FilterClause[] = [];
    for (let i = 1; i < expr.length; i++) {
      const parsed = tryParseClause(expr[i]);
      if (!parsed) {
        return { kind: 'expression', raw: expr };
      }
      clauses.push(parsed);
    }
    return { kind: 'simple', combinator, clauses };
  }

  const single = tryParseClause(expr);
  if (single) {
    return { kind: 'simple', combinator: 'all', clauses: [single] };
  }

  return { kind: 'expression', raw: expr };
};
