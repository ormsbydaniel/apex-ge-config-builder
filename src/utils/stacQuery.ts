import { resolveAssetUrl } from '@/utils/stacUtils';

export interface StacCoreQuery {
  bbox?: [number, number, number, number];
  datetimeStart?: string;
  datetimeEnd?: string;
  limit?: number;
}

export type StacQueryTarget =
  | { kind: 'items'; itemsUrl: string }
  | { kind: 'item' }
  | { kind: 'static' };

type FetchLike = (url: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status?: number;
  json: () => Promise<any>;
}>;

const parseFinite = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export const parseStacCoreQuery = (url: string): StacCoreQuery => {
  try {
    const parsed = new URL(url);
    const bboxValues = parsed.searchParams.get('bbox')?.split(',').map((value) => parseFinite(value));
    const bbox = bboxValues?.length === 4 && bboxValues.every((value) => value !== undefined)
      ? bboxValues as [number, number, number, number]
      : undefined;
    const datetime = parsed.searchParams.get('datetime');
    const [datetimeStart, datetimeEnd] = datetime?.includes('/')
      ? datetime.split('/', 2)
      : [datetime, datetime];
    const rawLimit = parsed.searchParams.get('limit');
    const limit = rawLimit && /^\d+$/.test(rawLimit) && Number(rawLimit) > 0
      ? Number(rawLimit)
      : undefined;

    return {
      bbox,
      datetimeStart: datetimeStart && datetimeStart !== '..' ? datetimeStart : undefined,
      datetimeEnd: datetimeEnd && datetimeEnd !== '..' ? datetimeEnd : undefined,
      limit,
    };
  } catch {
    return {};
  }
};

export const updateStacCoreQuery = (url: string, query: StacCoreQuery): string => {
  const parsed = new URL(url);
  if (query.bbox) parsed.searchParams.set('bbox', query.bbox.join(','));
  else parsed.searchParams.delete('bbox');

  if (query.datetimeStart || query.datetimeEnd) {
    parsed.searchParams.set('datetime', `${query.datetimeStart || '..'}/${query.datetimeEnd || '..'}`);
  } else {
    parsed.searchParams.delete('datetime');
  }

  if (query.limit !== undefined) parsed.searchParams.set('limit', String(query.limit));
  else parsed.searchParams.delete('limit');
  return parsed.toString();
};

export const validateBbox = (values: string[]): string | undefined => {
  if (values.every((value) => value.trim() === '')) return undefined;
  if (values.length !== 4 || values.some((value) => parseFinite(value) === undefined)) return 'Enter all four coordinates as numbers.';
  const [west, south, east, north] = values.map(Number);
  if (west > east) return 'West must not exceed east.';
  if (south > north) return 'South must not exceed north.';
  return undefined;
};

export const toStacDateTime = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export async function inspectStacQueryTarget(
  url: string,
  fetcher: FetchLike = fetch as unknown as FetchLike,
): Promise<StacQueryTarget> {
  const parsed = new URL(url);
  if (/\/items\/[^/?#]+\/?$/.test(parsed.pathname)) return { kind: 'item' };
  if (/\/items\/?$/.test(parsed.pathname)) return { kind: 'items', itemsUrl: url };

  const response = await fetcher(url, { headers: { Accept: 'application/json, application/geo+json' } });
  if (!response.ok) throw new Error(`STAC request failed (${response.status ?? 'error'})`);
  const data = await response.json();
  if (data?.type === 'Feature') return { kind: 'item' };
  if (Array.isArray(data?.features)) return { kind: 'items', itemsUrl: url };
  const itemsLink = (data?.links as Array<{ rel?: string; href?: string }> | undefined)
    ?.find((link) => link.rel === 'items' && link.href);
  return itemsLink?.href
    ? { kind: 'items', itemsUrl: resolveAssetUrl(itemsLink.href, url) }
    : { kind: 'static' };
}