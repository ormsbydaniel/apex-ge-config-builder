import { ValidationErrorDetails } from '@/types/config';

export interface RemovedSource {
  index: number;
  name: string;
}

export interface RemoveInvalidSourcesResult {
  config: any;
  removed: RemovedSource[];
}

/**
 * Drop every source that has at least one validation error scoped to it.
 * Errors with paths that do not start with `sources.<n>` are ignored here —
 * call sites should only invoke this when all errors are source-scoped.
 */
export function removeInvalidSources(
  rawConfig: any,
  errors: ValidationErrorDetails[],
): RemoveInvalidSourcesResult {
  const sources = Array.isArray(rawConfig?.sources) ? rawConfig.sources : [];
  const badIndices = new Set<number>();

  for (const err of errors) {
    const path = err.path;
    if (!path || path.length < 2) continue;
    if (path[0] !== 'sources') continue;
    const idx = typeof path[1] === 'number' ? path[1] : Number(path[1]);
    if (!Number.isInteger(idx)) continue;
    if (idx < 0 || idx >= sources.length) continue;
    badIndices.add(idx);
  }

  const removed: RemovedSource[] = [];
  const keptSources = sources.filter((src: any, idx: number) => {
    if (badIndices.has(idx)) {
      removed.push({ index: idx, name: src?.name ?? `Source ${idx + 1}` });
      return false;
    }
    return true;
  });

  return {
    config: { ...rawConfig, sources: keptSources },
    removed,
  };
}

/**
 * Returns true when every error in the list is scoped to a data source.
 * Used by the UI to decide whether the "Remove invalid sources" action is safe.
 */
export function allErrorsAreSourceScoped(errors: ValidationErrorDetails[]): boolean {
  if (errors.length === 0) return false;
  return errors.every((err) => err.path?.[0] === 'sources' && err.path.length >= 2);
}
