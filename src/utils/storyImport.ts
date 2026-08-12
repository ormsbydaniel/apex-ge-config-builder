/**
 * Story import helpers.
 *
 * Pure functions used by the "Import story" flow to copy a story out of a
 * donor configuration into the active configuration:
 *  - collect every source id a story references (activeLayers, baseLayer,
 *    panelState.focusLayer)
 *  - rewrite those references after donor layers have been cloned (cloning
 *    always mints a fresh id, so the donor ids are meaningless in the target)
 *  - drop references to layers the user chose not to import
 *  - de-duplicate story ids / titles against the target config
 */

import type { Story } from '@/types/config';

const deepClone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // fall through
    }
  }
  return JSON.parse(JSON.stringify(value));
};

/** Every source id referenced anywhere in the story's steps. */
export const collectStoryLayerRefs = (story: any): string[] => {
  const refs = new Set<string>();
  const steps: any[] = Array.isArray(story?.steps) ? story.steps : [];
  for (const step of steps) {
    for (const al of Array.isArray(step?.activeLayers) ? step.activeLayers : []) {
      if (al && typeof al.id === 'string' && al.id) refs.add(al.id);
    }
    if (typeof step?.baseLayer === 'string' && step.baseLayer) refs.add(step.baseLayer);
    const focus = step?.panelState?.focusLayer;
    if (typeof focus === 'string' && focus) refs.add(focus);
    const fit = (step?.viewport as any)?.fitLayer;
    if (typeof fit === 'string' && fit) refs.add(fit);
  }
  return Array.from(refs);
};

export interface RemapResult {
  story: Story;
  /** Number of individual references that had to be dropped. */
  dropped: number;
}

/**
 * Rewrites all layer references in a story using `idMap` (donor id -> new id).
 * References with no mapping are removed from the step.
 */
export const remapStoryLayerRefs = (story: any, idMap: Map<string, string>): RemapResult => {
  const cloned = deepClone(story);
  let dropped = 0;

  const map = (id: string | undefined): string | undefined => {
    if (typeof id !== 'string' || !id) return undefined;
    const next = idMap.get(id);
    if (next) return next;
    dropped += 1;
    return undefined;
  };

  const steps: any[] = Array.isArray(cloned?.steps) ? cloned.steps : [];
  for (const step of steps) {
    if (Array.isArray(step.activeLayers)) {
      step.activeLayers = step.activeLayers
        .map((al: any) => {
          const nextId = map(al?.id);
          return nextId ? { ...al, id: nextId } : null;
        })
        .filter(Boolean);
    }

    if (step.baseLayer !== undefined) {
      const nextBase = map(step.baseLayer);
      if (nextBase) step.baseLayer = nextBase;
      else delete step.baseLayer;
    }

    if (step.panelState?.focusLayer !== undefined) {
      const nextFocus = map(step.panelState.focusLayer);
      if (nextFocus) step.panelState.focusLayer = nextFocus;
      else delete step.panelState.focusLayer;
    }

    const viewport: any = step.viewport;
    if (viewport && typeof viewport.fitLayer === 'string') {
      const nextFit = map(viewport.fitLayer);
      if (nextFit) viewport.fitLayer = nextFit;
      else delete viewport.fitLayer;
    }
  }

  return { story: cloned as Story, dropped };
};

export const uniqueStoryId = (base: string, existing: string[]): string => {
  const seed = base && base.trim() ? base.trim() : 'story';
  if (!existing.includes(seed)) return seed;
  let n = 2;
  while (existing.includes(`${seed}-${n}`)) n += 1;
  return `${seed}-${n}`;
};

export const uniqueStoryTitle = (base: string, existing: string[]): string => {
  const seed = base && base.trim() ? base.trim() : 'Imported story';
  if (!existing.includes(seed)) return seed;
  let n = 2;
  while (existing.includes(`${seed} (${n})`)) n += 1;
  return `${seed} (${n})`;
};
