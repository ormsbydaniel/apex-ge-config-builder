/**
 * @deprecated Helper to migrate per-source `workflows` arrays into the
 * top-level `config.workflows` collection. See README.md for context.
 */

import { WorkflowItem } from '@/types/dataSource';

interface ConfigShape {
  workflows?: WorkflowItem[];
  sources?: Array<{ workflows?: WorkflowItem[]; [k: string]: any }>;
  [k: string]: any;
}

export interface MigrationResult<C extends ConfigShape> {
  config: C;
  movedCount: number;
}

const isPlainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Deep-merge `overlay` onto `base`. Overlay values win; nested plain objects
 * are merged recursively; arrays and primitives are replaced wholesale.
 */
const deepMerge = <T extends Record<string, any>>(
  base: T | undefined,
  overlay: T | undefined,
): T | undefined => {
  if (!base && !overlay) return undefined;
  if (!base) return overlay;
  if (!overlay) return base;
  const out: Record<string, any> = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
};

/**
 * Returns a new config with every `source.workflows[]` entry hoisted into
 * `config.workflows[]` (preserving source order). The original sources have
 * their `workflows` field removed in the returned config. Hoisted workflows
 * inherit the parent source's `meta` and `layout` (workflow's own values
 * win on conflict). Input is not mutated.
 */
export function migrateSourceWorkflowsToTopLevel<C extends ConfigShape>(
  config: C,
): MigrationResult<C> {
  const topLevel: WorkflowItem[] = Array.isArray(config.workflows)
    ? [...config.workflows]
    : [];
  let moved = 0;

  const sources = (config.sources ?? []).map((source) => {
    const wfs = source.workflows;
    if (!Array.isArray(wfs) || wfs.length === 0) return source;
    const parentMeta = (source as any).meta;
    const parentLayout = (source as any).layout;
    for (const wf of wfs) {
      const merged: WorkflowItem = { ...(wf as any) };
      const mergedMeta = deepMerge(parentMeta, (wf as any).meta);
      const mergedLayout = deepMerge(parentLayout, (wf as any).layout);
      if (mergedMeta) (merged as any).meta = mergedMeta;
      if (mergedLayout) (merged as any).layout = mergedLayout;
      topLevel.push(merged);
      moved += 1;
    }
    const { workflows: _drop, ...rest } = source;
    return rest;
  });

  const next: C = {
    ...config,
    workflows: topLevel,
    sources,
  } as C;

  return { config: next, movedCount: moved };
}
