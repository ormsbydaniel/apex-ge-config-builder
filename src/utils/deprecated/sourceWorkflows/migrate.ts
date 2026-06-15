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

/**
 * Returns a new config with every `source.workflows[]` entry hoisted into
 * `config.workflows[]` (preserving source order). The original sources have
 * their `workflows` field removed in the returned config. Input is not
 * mutated.
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
    for (const wf of wfs) {
      topLevel.push(wf);
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
