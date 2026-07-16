import type { StoryStep, StoryActiveLayer } from '@/types/config';

export type CopyFacet =
  | 'navigation'
  | 'baseLayer'
  | 'activeLayers'
  | 'constraints'
  | 'panelState';

export type MergeStrategy = 'replace' | 'append';

export const FACET_LABEL: Record<CopyFacet, string> = {
  navigation: 'Navigation',
  baseLayer: 'Base map',
  activeLayers: 'Active layers',
  constraints: 'Constraints',
  panelState: 'Panel state',
};

/** Facets that support Replace / Append. Others always overwrite. */
export const STRATEGY_FACETS: CopyFacet[] = ['activeLayers', 'constraints'];

const clone = <T,>(v: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));

/** Returns true if the source step has any content worth copying for this facet. */
export const facetPresent = (step: StoryStep, facet: CopyFacet): boolean => {
  switch (facet) {
    case 'navigation':
      return !!step.viewport;
    case 'baseLayer':
      return !!step.baseLayer;
    case 'activeLayers':
      return (step.activeLayers?.length ?? 0) > 0;
    case 'constraints':
      return (step.activeLayers ?? []).some(
        (l) => (l.constraints?.length ?? 0) > 0,
      );
    case 'panelState':
      return !!step.panelState;
  }
};

const mergeActiveLayers = (
  target: StoryActiveLayer[],
  source: StoryActiveLayer[],
  strategy: MergeStrategy,
): StoryActiveLayer[] => {
  if (strategy === 'replace') return clone(source);
  const byId = new Map(target.map((l) => [l.id, l] as const));
  const out: StoryActiveLayer[] = target.map(clone);
  for (const s of source) {
    if (!byId.has(s.id)) out.push(clone(s));
  }
  return out;
};

const mergeConstraintsOnly = (
  target: StoryActiveLayer[],
  source: StoryActiveLayer[],
  strategy: MergeStrategy,
): StoryActiveLayer[] => {
  const map = new Map<string, StoryActiveLayer>(
    target.map((l) => [l.id, clone(l)] as const),
  );
  for (const s of source) {
    const src = s.constraints ?? [];
    if (src.length === 0) continue;
    const existing = map.get(s.id);
    if (!existing) {
      // Layer not yet in target — add a minimal entry carrying just constraints.
      map.set(s.id, { id: s.id, constraints: clone(src) });
      continue;
    }
    if (strategy === 'replace') {
      existing.constraints = clone(src);
    } else {
      const cur = existing.constraints ?? [];
      const seen = new Set(cur.map((c) => c.label));
      existing.constraints = [
        ...cur,
        ...src.filter((c) => !seen.has(c.label)).map(clone),
      ];
    }
  }
  return Array.from(map.values());
};

/**
 * Return a new step with the requested facet copied from `source` into
 * `target`, honouring the given merge strategy where applicable.
 */
export const applyFacetCopy = (
  target: StoryStep,
  source: StoryStep,
  facet: CopyFacet,
  strategy: MergeStrategy = 'replace',
): StoryStep => {
  switch (facet) {
    case 'navigation':
      return { ...target, viewport: clone(source.viewport) };
    case 'baseLayer':
      return { ...target, baseLayer: source.baseLayer };
    case 'activeLayers':
      return {
        ...target,
        activeLayers: mergeActiveLayers(
          target.activeLayers ?? [],
          source.activeLayers ?? [],
          strategy,
        ),
      };
    case 'constraints':
      return {
        ...target,
        activeLayers: mergeConstraintsOnly(
          target.activeLayers ?? [],
          source.activeLayers ?? [],
          strategy,
        ),
      };
    case 'panelState':
      return {
        ...target,
        panelState: source.panelState ? clone(source.panelState) : undefined,
      };
  }
};

/** Apply multiple facets to a target step in order. */
export const applyFacetCopies = (
  target: StoryStep,
  source: StoryStep,
  facets: CopyFacet[],
  strategies: Partial<Record<CopyFacet, MergeStrategy>>,
): StoryStep => {
  let out = target;
  for (const facet of facets) {
    out = applyFacetCopy(out, source, facet, strategies[facet] ?? 'replace');
  }
  return out;
};
