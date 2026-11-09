import type { DataSourceItem } from '@/types/dataSource';

export const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'difference', 'exclusion'] as const;
export type BlendMode = typeof BLEND_MODES[number];

export const DISPLAY_KEYS = ['opacity', 'minZoom', 'maxZoom', 'zIndex', 'blendMode'] as const;

export interface DisplaySettings {
  opacity?: number;
  minZoom?: number;
  maxZoom?: number;
  zIndex?: number;
  blendMode?: BlendMode;
}

export const extractDisplaySettings = (item?: DataSourceItem): DisplaySettings => ({
  opacity: item?.opacity,
  minZoom: item?.minZoom,
  maxZoom: item?.maxZoom,
  zIndex: item?.zIndex,
  blendMode: item?.blendMode,
});

/** Applies settings; undefined values (and 'normal' blend) remove the key. zIndex is required by the schema, so it is kept. */
export const applyDisplaySettings = (item: DataSourceItem, s: DisplaySettings): DataSourceItem => {
  const next: Record<string, unknown> = { ...item };
  for (const key of DISPLAY_KEYS) {
    const v = s[key];
    if (key === 'zIndex') { next.zIndex = v ?? item.zIndex ?? 0; continue; }
    if (v === undefined || (key === 'blendMode' && v === 'normal') || (key === 'opacity' && v === 1)) delete next[key];
    else next[key] = v;
  }
  return next as unknown as DataSourceItem;
};

export const clearDisplaySettings = (item: DataSourceItem): DataSourceItem =>
  applyDisplaySettings(item, { zIndex: item.zIndex });

export const ZOOM_HINTS: Array<[number, string]> = [
  [0, 'World'], [3, 'Continent'], [5, 'Country'], [8, 'Region'], [11, 'City'], [14, 'Neighbourhood'], [16, 'Street'], [18, 'Buildings'],
];

export const zoomHint = (z: number): string => {
  let label = ZOOM_HINTS[0][1];
  for (const [lvl, l] of ZOOM_HINTS) if (z >= lvl) label = l;
  return label;
};

export const summariseDisplay = (s: DisplaySettings): string | null => {
  const parts: string[] = [];
  if (s.opacity !== undefined && s.opacity !== 1) parts.push(`Opacity ${Math.round(s.opacity * 100)}%`);
  if (s.minZoom !== undefined || s.maxZoom !== undefined) parts.push(`Zoom ${s.minZoom ?? 0}–${s.maxZoom ?? '∞'}`);
  if (s.blendMode && s.blendMode !== 'normal') parts.push(s.blendMode);
  return parts.length ? parts.join(' • ') : null;
};
