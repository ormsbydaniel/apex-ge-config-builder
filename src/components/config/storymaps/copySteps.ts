import type { StoryStep, StoryActiveLayer } from '@/types/config';

export type CopyFacet =
  | 'navigation'
  | 'baseLayer'
  | 'activeLayers'
  | 'constraints'
  | 'panelState'
  | 'contentDescription';

export type MergeStrategy = 'replace' | 'append' | 'insertStart' | 'insertEnd';

export const FACET_LABEL: Record<CopyFacet, string> = {
  navigation: 'Navigation',
  baseLayer: 'Base map',
  activeLayers: 'Active layers',
  constraints: 'Constraints',
  panelState: 'Panel state',
  contentDescription: 'Description',
};

export const STRATEGY_LABEL: Record<MergeStrategy, string> = {
  replace: 'Replace',
  append: 'Append',
  insertStart: 'Insert at start',
  insertEnd: 'Insert at end',
};

/** Strategies offered per facet. Empty array = always overwrite (no chooser). */
export const FACET_STRATEGIES: Record<CopyFacet, MergeStrategy[]> = {
  navigation: [],
  baseLayer: [],
  activeLayers: ['replace', 'append'],
  constraints: ['replace', 'append'],
  panelState: [],
  contentDescription: ['replace', 'insertStart', 'insertEnd'],
};

/** @deprecated Use FACET_STRATEGIES. Kept for back-compat. */
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
    case 'contentDescription':
      return !!step.content?.description?.trim();
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
    case 'contentDescription': {
      const src = source.content?.description ?? '';
      const tgt = target.content?.description ?? '';
      let next: string;
      if (strategy === 'insertStart') {
        next = src && tgt ? `${src}\n\n${tgt}` : src || tgt;
      } else if (strategy === 'insertEnd') {
        next = src && tgt ? `${tgt}\n\n${src}` : src || tgt;
      } else {
        next = src;
      }
      return {
        ...target,
        content: { ...(target.content ?? {}), description: next },
      };
    }
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

// ---------- Preview / diff helpers ----------

export type FacetChange =
  | { kind: 'noop' }
  | { kind: 'replace'; before: string; after: string }
  | { kind: 'append'; added: string[]; keptCount: number }
  | {
      kind: 'constraints';
      strategy: MergeStrategy;
      perLayer: Array<{
        layerId: string;
        beforeLabels: string[];
        afterLabels: string[];
        addedLabels: string[];
        removedLabels: string[];
      }>;
    };

export interface StepFacetPreview {
  facet: CopyFacet;
  strategy: MergeStrategy;
  change: FacetChange;
}

export interface StepChangePreview {
  targetIndex: number;
  targetTitle: string;
  facets: StepFacetPreview[];
  anyChange: boolean;
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const summariseViewport = (v: StoryStep['viewport']): string => {
  if (!v) return '(none)';
  if ('zoom' in v)
    return `Zoom ${v.zoom} · [${v.center.map((n) => n.toFixed(2)).join(', ')}]`;
  if ('fitLayer' in v) return `Fit layer: ${v.fitLayer}`;
  return `Fit extent: [${v.extent.map((n) => n.toFixed(2)).join(', ')}]`;
};

const summarisePanel = (p: StoryStep['panelState']): string => {
  if (!p) return '(none)';
  const bits: string[] = [];
  if (p.focusLayer) bits.push(`focus: ${p.focusLayer}`);
  if (p.tab?.id) bits.push(`tab: ${p.tab.id}`);
  return bits.length ? bits.join(' · ') : '(empty)';
};

const diffFacet = (
  facet: CopyFacet,
  strategy: MergeStrategy,
  before: StoryStep,
  after: StoryStep,
  source: StoryStep,
): FacetChange => {
  switch (facet) {
    case 'navigation': {
      if (eq(before.viewport, after.viewport)) return { kind: 'noop' };
      return {
        kind: 'replace',
        before: summariseViewport(before.viewport),
        after: summariseViewport(after.viewport),
      };
    }
    case 'baseLayer': {
      if ((before.baseLayer ?? '') === (after.baseLayer ?? ''))
        return { kind: 'noop' };
      return {
        kind: 'replace',
        before: before.baseLayer ?? '(none)',
        after: after.baseLayer ?? '(none)',
      };
    }
    case 'panelState': {
      if (eq(before.panelState, after.panelState)) return { kind: 'noop' };
      return {
        kind: 'replace',
        before: summarisePanel(before.panelState),
        after: summarisePanel(after.panelState),
      };
    }
    case 'activeLayers': {
      const beforeIds = (before.activeLayers ?? []).map((l) => l.id);
      const afterIds = (after.activeLayers ?? []).map((l) => l.id);
      if (eq(beforeIds, afterIds) && eq(before.activeLayers, after.activeLayers))
        return { kind: 'noop' };
      if (strategy === 'append') {
        const beforeSet = new Set(beforeIds);
        const added = afterIds.filter((id) => !beforeSet.has(id));
        if (added.length === 0) return { kind: 'noop' };
        return { kind: 'append', added, keptCount: beforeIds.length };
      }
      return {
        kind: 'replace',
        before: beforeIds.length ? beforeIds.join(', ') : '(none)',
        after: afterIds.length ? afterIds.join(', ') : '(none)',
      };
    }
    case 'constraints': {
      const beforeMap = new Map(
        (before.activeLayers ?? []).map((l) => [l.id, l.constraints ?? []]),
      );
      const afterMap = new Map(
        (after.activeLayers ?? []).map((l) => [l.id, l.constraints ?? []]),
      );
      const srcLayerIds = (source.activeLayers ?? [])
        .filter((l) => (l.constraints?.length ?? 0) > 0)
        .map((l) => l.id);
      const perLayer: Array<{
        layerId: string;
        beforeLabels: string[];
        afterLabels: string[];
        addedLabels: string[];
        removedLabels: string[];
      }> = [];
      for (const id of srcLayerIds) {
        const b = (beforeMap.get(id) ?? []).map((c) => c.label);
        const a = (afterMap.get(id) ?? []).map((c) => c.label);
        if (eq(b, a)) continue;
        const bSet = new Set(b);
        const aSet = new Set(a);
        perLayer.push({
          layerId: id,
          beforeLabels: b,
          afterLabels: a,
          addedLabels: a.filter((l) => !bSet.has(l)),
          removedLabels: b.filter((l) => !aSet.has(l)),
        });
      }
      if (perLayer.length === 0) return { kind: 'noop' };
      return { kind: 'constraints', strategy, perLayer };
    }
  }
};

export const buildCopyPreview = (
  source: StoryStep,
  targets: { index: number; step: StoryStep }[],
  facets: CopyFacet[],
  strategies: Partial<Record<CopyFacet, MergeStrategy>>,
): StepChangePreview[] => {
  return targets.map(({ index, step }) => {
    const after = applyFacetCopies(step, source, facets, strategies);
    const facetPreviews: StepFacetPreview[] = facets.map((f) => {
      const strat = strategies[f] ?? 'replace';
      return { facet: f, strategy: strat, change: diffFacet(f, strat, step, after, source) };
    });
    return {
      targetIndex: index,
      targetTitle: step.content?.title ?? step.id ?? '(untitled)',
      facets: facetPreviews,
      anyChange: facetPreviews.some((f) => f.change.kind !== 'noop'),
    };
  });
};
