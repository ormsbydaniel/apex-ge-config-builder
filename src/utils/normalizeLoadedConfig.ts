import { DataSourceItem } from '@/types/config';
import { validateImages } from '@/utils/imageValidation';
import { safeHref } from '@/utils/urlSanitizer';

/**
 * Shared by LOAD_CONFIG and RESTORE_DRAFT so a restored draft and a loaded
 * file go through the same legacy normalisation.
 */
const normalizeDataToArray = (data: unknown): DataSourceItem[] => {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      ...item,
      format: item.format || 'wms',
      zIndex: item.zIndex ?? 0,
      url: item.url || (item.images?.[0]?.url) || '',
      ...(item.images && {
        images: validateImages(item.images),
      }),
    }));
  } else if (data && typeof data === 'object') {
    const record = data as Record<string, any>;
    if (record.type === 'swipe') {
      return [{
        format: 'comparison',
        zIndex: 0,
        type: record.type,
        url: `swipe:${record.clippedSource}:${record.baseSources.join(',')}`,
      }];
    }
    return [{
      ...record,
      url: record.url || '',
      format: record.format || 'wms',
      zIndex: record.zIndex ?? 0,
      ...(record.images && {
        images: validateImages(record.images),
      }),
    }];
  }
  return [];
};

const migrateAxis = (axis: any) => {
  if (!axis || typeof axis !== 'object') return axis;
  const next: any = { ...axis };
  if (typeof next.title === 'string') {
    next.title = {
      text: next.title,
      ...(next.titleFont ? { font: next.titleFont } : {}),
    };
  }
  if ('titleFont' in next) delete next.titleFont;
  return next;
};

const migrateChart = (chart: any) => {
  if (!chart?.layout) return chart;
  const layout = { ...chart.layout };
  if (layout.xaxis) layout.xaxis = migrateAxis(layout.xaxis);
  if (layout.yaxis) layout.yaxis = migrateAxis(layout.yaxis);
  return { ...chart, layout };
};

/**
 * Link URLs are rendered as anchors in the preview, which runs with the
 * builder's origin and the user's token, so `javascript:` and similar schemes
 * from a shared config must be dropped before they reach it.
 */
type Obj = Record<string, unknown>;
const isObj = (value: unknown): value is Obj => Boolean(value) && typeof value === 'object';

const withSafeUrl = (link: unknown): unknown => {
  if (!isObj(link) || !link.url) return link;
  if (typeof link.url === 'string' && safeHref(link.url)) return link;
  console.warn('[Config Builder] Dropped unsafe link URL from loaded config:', link.url);
  const { url: _unsafe, ...rest } = link;
  return rest;
};

const withSafeAttribution = (meta: unknown): unknown =>
  isObj(meta) && meta.attribution ? { ...meta, attribution: withSafeUrl(meta.attribution) } : meta;

const withSafeFooter = (layout: unknown): unknown =>
  isObj(layout) && Array.isArray(layout.footer)
    ? { ...layout, footer: layout.footer.map(withSafeUrl) }
    : layout;

export interface NormalizedLoadedConfig {
  config: Record<string, any>;
  source: any;
}

/** Builder-only fields that must not be treated as configuration content. */
const INTERNAL_FIELDS = [
  '__source',
  'isDirty',
  'isLoading',
  'lastLoaded',
  'lastLoadedSource',
  'lastExported',
  'validationResults',
  'hasUnsavedFormChanges',
  'unsavedFormDescription',
  'env',
] as const;

export function normalizeLoadedConfig(payload: any): NormalizedLoadedConfig {
  const source = payload?.__source ?? null;
  const body: Record<string, any> = { ...(payload ?? {}) };
  for (const field of INTERNAL_FIELDS) delete body[field];

  const sources = Array.isArray(body.sources) ? body.sources : [];

  const config = {
    ...body,
    exportPrefix: body.exportPrefix || 'config',
    services: body.services || [],
    workflows: body.workflows || [],
    mapConstraints: body.mapConstraints !== undefined
      ? {
          ...body.mapConstraints,
          projection: body.mapConstraints.projection || 'EPSG:3857',
        }
      : {
          zoom: 0,
          center: [0, 0],
          projection: 'EPSG:3857',
        },
    ...(body.layout !== undefined && { layout: withSafeFooter(body.layout) }),
    sources: sources.map((sourceItem: any) => ({
      ...sourceItem,
      ...(sourceItem.meta !== undefined && { meta: withSafeAttribution(sourceItem.meta) }),
      data: normalizeDataToArray(sourceItem.data),
      ...(sourceItem.statistics && { statistics: sourceItem.statistics }),
      ...(Array.isArray(sourceItem.charts) && { charts: sourceItem.charts.map(migrateChart) }),
    })),
  };

  return { config, source };
}
