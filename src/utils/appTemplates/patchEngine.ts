/**
 * Applies declarative template patches to a copy of a base config.
 * Pure functions: helpers are passed in so the engine can be tested alone.
 */
import type { Condition, TemplatePatch, ValueExpr } from './templateSchema';
import type { AppTemplateParams } from './templates';

export type TransformHelper = (args: Record<string, unknown>) => unknown;

export interface EvalContext {
  params: AppTemplateParams;
  computed: Record<string, ValueExpr>;
  transforms: Record<string, TransformHelper>;
  /** Guards against ref cycles. */
  stack?: string[];
}

/** Built-in answers every template can read with `from`. */
const answer = (p: AppTemplateParams, id: string): unknown => {
  switch (id) {
    case 'title': return p.title;
    case 'center': return p.center;
    case 'zoom': return p.zoom;
    case 'centerLon': return p.center[0];
    case 'centerLat': return p.center[1];
    default: return p.values[id];
  }
};

export const evalExpr = (e: ValueExpr, ctx: EvalContext): unknown => {
  if ('value' in e) return e.value;
  if ('from' in e) return answer(ctx.params, e.from);
  if ('text' in e) return e.text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k: string) => {
    const v = k in ctx.computed ? evalExpr({ ref: k }, ctx) : answer(ctx.params, k);
    return v === undefined || v === null ? '' : String(v);
  });
  if ('ref' in e) {
    const stack = ctx.stack ?? [];
    if (stack.includes(e.ref)) throw new Error(`Computed value "${e.ref}" refers to itself`);
    const def = ctx.computed[e.ref];
    if (!def) throw new Error(`Unknown computed value "${e.ref}"`);
    return evalExpr(def, { ...ctx, stack: [...stack, e.ref] });
  }
  if ('map' in e) {
    const key = String(answer(ctx.params, e.map) ?? '');
    if (Object.prototype.hasOwnProperty.call(e.cases, key)) return e.cases[key];
    return e.default ? evalExpr(e.default, ctx) : undefined;
  }
  const fn = ctx.transforms[e.use];
  if (!fn) throw new Error(`Unknown helper "${e.use}"`);
  const args = Object.fromEntries(Object.entries(e.args ?? {}).map(([k, v]) => [k, evalExpr(v, ctx)]));
  return fn(args);
};

/** Conditions read a computed value when one has that name, otherwise an answer. */
export const conditionMet = (c: Condition | undefined, ctx: EvalContext) => {
  if (!c) return true;
  const raw = c.field in ctx.computed ? evalExpr({ ref: c.field }, ctx) : answer(ctx.params, c.field);
  const v = String(raw ?? '');
  if (c.in && !c.in.includes(v)) return false;
  if (c.notIn && c.notIn.includes(v)) return false;
  return true;
};

const parsePointer = (ptr: string) =>
  ptr.split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

/** Resolve the parent container of a pointer; throws when the path does not exist. */
const parentOf = (root: unknown, ptr: string): { parent: Record<string, unknown> | unknown[]; key: string } => {
  const parts = parsePointer(ptr);
  if (parts.length === 0) throw new Error('Cannot patch the whole config');
  let cur: unknown = root;
  for (const part of parts.slice(0, -1)) {
    if (cur === null || typeof cur !== 'object' || !(part in (cur as object))) {
      throw new Error(`Path ${ptr} does not exist in the base config`);
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  if (cur === null || typeof cur !== 'object') throw new Error(`Path ${ptr} does not exist in the base config`);
  return { parent: cur as Record<string, unknown>, key: parts[parts.length - 1] };
};

const exprOf = (patch: Record<string, unknown>): ValueExpr => {
  const { set: _s, when: _w, ...rest } = patch;
  return rest as ValueExpr;
};

export const applyPatches = (
  base: Record<string, unknown>,
  patches: TemplatePatch[],
  ctx: EvalContext,
): Record<string, unknown> => {
  const out = structuredClone(base);
  for (const patch of patches) {
    if (!conditionMet(patch.when, ctx)) continue;
    if ('remove' in patch && typeof patch.remove === 'string') {
      const { parent, key } = parentOf(out, patch.remove);
      if (Array.isArray(parent)) parent.splice(Number(key), 1);
      else delete parent[key];
      continue;
    }
    const ptr = (patch as { set: string }).set;
    const { parent, key } = parentOf(out, ptr);
    const value = evalExpr(exprOf(patch as Record<string, unknown>), ctx);
    if (Array.isArray(parent)) parent[Number(key)] = value;
    else parent[key] = value;
  }
  return out;
};
