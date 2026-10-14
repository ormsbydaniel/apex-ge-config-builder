import { DataSourceItem } from '@/types/dataSource';

export type StyleKeyGroup = 'style' | 'bands' | 'display' | 'recipe';

export const STYLE_KEY_GROUPS: Record<StyleKeyGroup, { label: string; keys: string[]; defaultOn: boolean }> = {
  style: { label: 'Style', keys: ['style'], defaultOn: true },
  bands: { label: 'Bands', keys: ['bands', 'convertToRGB', 'normalize'], defaultOn: true },
  display: { label: 'Display', keys: ['opacity', 'minZoom', 'maxZoom', 'zIndex'], defaultOn: true },
  recipe: { label: 'Recipe metadata', keys: ['spectralIndex', 'computedComposite', 'styleSource', 'batchStretch'], defaultOn: false },
};

export const keysForGroups = (groups: StyleKeyGroup[]): string[] =>
  groups.flatMap(g => STYLE_KEY_GROUPS[g].keys);

/** Pick the shown keys from one dataset, in group order. */
export const extractStyleFields = (item: DataSourceItem | undefined, groups: StyleKeyGroup[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (!item) return out;
  for (const k of keysForGroups(groups)) if (item[k] !== undefined) out[k] = item[k];
  return out;
};

/** Shown keys whose values differ between the given datasets. */
export const diffKeys = (items: DataSourceItem[], groups: StyleKeyGroup[]): string[] => {
  if (items.length < 2) return [];
  return keysForGroups(groups).filter(k => {
    const first = JSON.stringify(items[0][k]);
    return items.some(i => JSON.stringify(i[k]) !== first);
  });
};

/** Write edited fields to the datasets at `indices`; removes shown keys absent from `edited`; never touches other keys. */
export const applyStyleFields = (
  items: DataSourceItem[],
  indices: number[],
  edited: Record<string, unknown>,
  groups: StyleKeyGroup[],
): DataSourceItem[] => {
  const shown = keysForGroups(groups);
  const target = new Set(indices);
  return items.map((item, i) => {
    if (!target.has(i)) return item;
    const next: DataSourceItem = { ...item };
    for (const k of shown) {
      if (k in edited) next[k] = edited[k];
      else delete next[k];
    }
    return next;
  });
};

/** Validate edited JSON; returns error messages (empty = ok). */
export const validateStyleFields = (edited: unknown, groups: StyleKeyGroup[]): string[] => {
  const errors: string[] = [];
  if (!edited || typeof edited !== 'object' || Array.isArray(edited)) return ['Top level must be a JSON object'];
  const e = edited as Record<string, unknown>;
  const shown = new Set(keysForGroups(groups));
  const unknown = Object.keys(e).filter(k => !shown.has(k));
  if (unknown.length) errors.push(`Keys not editable here: ${unknown.join(', ')}`);
  if (e.opacity !== undefined && (typeof e.opacity !== 'number' || e.opacity < 0 || e.opacity > 1)) errors.push('opacity must be a number between 0 and 1');
  for (const k of ['minZoom', 'maxZoom', 'zIndex']) if (e[k] !== undefined && typeof e[k] !== 'number') errors.push(`${k} must be a number`);
  if (e.bands !== undefined && !(Array.isArray(e.bands) && e.bands.every(b => Number.isInteger(b) && (b as number) > 0))) errors.push('bands must be an array of positive integers');
  for (const k of ['convertToRGB', 'normalize']) if (e[k] !== undefined && typeof e[k] !== 'boolean') errors.push(`${k} must be true or false`);
  return errors;
};
