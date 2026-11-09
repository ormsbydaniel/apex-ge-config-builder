import { resolveAssetUrl } from '@/utils/stacUtils';

export interface StacCoreQuery {
  bbox?: [number, number, number, number];
  datetimeStart?: string;
  datetimeEnd?: string;
  limit?: number;
}

export type StacQueryTarget =
  | { kind: 'items'; itemsUrl: string }
  | { kind: 'search'; searchUrl: string; collectionId: string }
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

export const getStacUrlBase = (url: string): string => url.split(/[?#]/, 1)[0];

export const replaceStacUrlBase = (currentUrl: string, nextValue: string): string => {
  const trimmed = nextValue.trim();
  if (!trimmed) return '';

  // A complete pasted URL with its own query string replaces everything as-is.
  if (trimmed.includes('?')) return trimmed;

  // While typing, keep the text verbatim — never normalise it through `new URL`,
  // which would append a trailing slash mid-edit and move the caret. The current
  // query string is re-attached by concatenation so it survives base edits.
  try {
    new URL(trimmed);
    const suffixStart = currentUrl.search(/[?#]/);
    return suffixStart === -1 ? trimmed : trimmed + currentUrl.slice(suffixStart);
  } catch {
    return trimmed;
  }
};

/** Collection id(s) referenced by a collection, items, item or `/search` URL. */
export const getStacCollectionIds = (url: string): string[] => {
  try {
    const parsed = new URL(url);
    const collections = parsed.searchParams.get('collections');
    if (/\/search\/?$/.test(parsed.pathname) && collections) {
      return collections.split(',').map((c) => c.trim()).filter(Boolean);
    }
    const match = parsed.pathname.match(/(?:^|\/)collections\/([^/?#]+)/);
    return match ? [decodeURIComponent(match[1])] : [];
  } catch {
    return [];
  }
};

/** True when the URL targets the STAC `/search` endpoint with a `collections` parameter. */
export const isStacSearchUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return /\/search\/?$/.test(parsed.pathname) && Boolean(parsed.searchParams.get('collections'));
  } catch {
    return false;
  }
};


/** Rewrites `.../collections/{id}/items?…` to `.../search?collections={id}&…`, preserving all filters. */
export const itemsUrlToSearchUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^(.*)\/collections\/([^/]+)\/items\/?$/);
    if (!match) return undefined;
    parsed.pathname = `${match[1]}/search`;
    parsed.searchParams.set('collections', match[2]);
    return parsed.toString();
  } catch {
    return undefined;
  }
};

/** Rewrites `.../search?collections={id}&…` back to `.../collections/{id}/items?…`. Single-collection only. */
export const searchUrlToItemsUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    if (!/\/search\/?$/.test(parsed.pathname)) return undefined;
    const collections = parsed.searchParams.get('collections')?.split(',').map((c) => c.trim()).filter(Boolean) ?? [];
    if (collections.length !== 1) return undefined;
    parsed.pathname = `${parsed.pathname.replace(/\/search\/?$/, '')}/collections/${collections[0]}/items`;
    parsed.searchParams.delete('collections');
    return parsed.toString();
  } catch {
    return undefined;
  }
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
  if (isStacSearchUrl(url)) {
    return { kind: 'search', searchUrl: url, collectionId: parsed.searchParams.get('collections')! };
  }

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
// ---------------------------------------------------------------------------
// CQL2-text property filters (OGC API Features Part 3), encoded only in the URL.
// ---------------------------------------------------------------------------

export type StacPropertyType = 'number' | 'string' | 'boolean' | 'datetime';
export type StacPropertyOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'like' | 'in';

export interface StacPropertyRule {
  property: string;
  type: StacPropertyType;
  operator: StacPropertyOperator;
  /** One value; two for `between`; one or more for `in`. */
  values: string[];
}

export const STAC_OPERATOR_LABELS: Record<StacPropertyOperator, string> = {
  eq: '=', neq: '≠', lt: '<', lte: '≤', gt: '>', gte: '≥', between: 'between', like: 'contains', in: 'is any of',
};

const OPERATOR_SYMBOLS: Partial<Record<StacPropertyOperator, string>> = {
  eq: '=', neq: '<>', lt: '<', lte: '<=', gt: '>', gte: '>=',
};

const quoteIdent = (key: string) => (/^[A-Za-z_][\w:.\-]*$/.test(key) ? key : `"${key.replace(/"/g, '')}"`);

const literal = (type: StacPropertyType, value: string): string => {
  if (type === 'number') return String(Number(value));
  if (type === 'boolean') return value === 'true' ? 'TRUE' : 'FALSE';
  const quoted = `'${value.replace(/'/g, "''")}'`;
  return type === 'datetime' ? `TIMESTAMP(${quoted})` : quoted;
};

export const serialiseCql2Rule = (rule: StacPropertyRule): string => {
  const id = quoteIdent(rule.property);
  const [a, b] = rule.values;
  switch (rule.operator) {
    case 'between': return `${id} BETWEEN ${literal(rule.type, a)} AND ${literal(rule.type, b)}`;
    case 'like': return `${id} LIKE '%${a.replace(/'/g, "''")}%'`;
    case 'in': return `${id} IN (${rule.values.map((v) => literal(rule.type, v)).join(', ')})`;
    default: return `${id} ${OPERATOR_SYMBOLS[rule.operator]} ${literal(rule.type, a)}`;
  }
};

export const serialiseCql2Rules = (rules: StacPropertyRule[]): string => rules.map(serialiseCql2Rule).join(' AND ');

/** Splits on top-level ` AND ` outside quotes/parentheses, re-joining BETWEEN ranges. */
const splitTopLevelAnd = (text: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let inQuote = false;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'") inQuote = !inQuote;
    else if (!inQuote && ch === '(') depth += 1;
    else if (!inQuote && ch === ')') depth -= 1;
    else if (!inQuote && depth === 0 && /\s/.test(ch) && /^\s+AND\s+/i.test(text.slice(i))) {
      const match = text.slice(i).match(/^\s+AND\s+/i)!;
      parts.push(text.slice(start, i));
      i += match[0].length - 1;
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  const merged: string[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    if (prev && /\bBETWEEN\s+\S+$/i.test(prev) && !/\bAND\b/i.test(prev.split(/\bBETWEEN\b/i)[1])) {
      merged[merged.length - 1] = `${prev} AND ${part}`;
    } else merged.push(part);
  }
  return merged.map((p) => p.trim());
};

const parseLiteral = (raw: string): { type: StacPropertyType; value: string } | undefined => {
  const text = raw.trim();
  let m = text.match(/^TIMESTAMP\(\s*'((?:[^']|'')*)'\s*\)$/i);
  if (m) return { type: 'datetime', value: m[1].replace(/''/g, "'") };
  m = text.match(/^'((?:[^']|'')*)'$/);
  if (m) return { type: 'string', value: m[1].replace(/''/g, "'") };
  if (/^(TRUE|FALSE)$/i.test(text)) return { type: 'boolean', value: text.toLowerCase() };
  if (text !== '' && Number.isFinite(Number(text))) return { type: 'number', value: text };
  return undefined;
};

const splitList = (text: string): string[] => {
  const items: string[] = [];
  let inQuote = false;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "'") inQuote = !inQuote;
    else if (!inQuote && text[i] === ',') { items.push(text.slice(start, i)); start = i + 1; }
  }
  items.push(text.slice(start));
  return items.map((s) => s.trim());
};

const IDENT = String.raw`("[^"]+"|[A-Za-z_][\w:.\-]*)`;
const unquote = (id: string) => id.replace(/^"|"$/g, '');

const parseClause = (clause: string): StacPropertyRule | undefined => {
  let m = clause.match(new RegExp(`^${IDENT}\\s+BETWEEN\\s+(.+?)\\s+AND\\s+(.+)$`, 'i'));
  if (m) {
    const a = parseLiteral(m[2]); const b = parseLiteral(m[3]);
    return a && b && a.type === b.type ? { property: unquote(m[1]), type: a.type, operator: 'between', values: [a.value, b.value] } : undefined;
  }
  m = clause.match(new RegExp(`^${IDENT}\\s+IN\\s*\\((.*)\\)$`, 'i'));
  if (m) {
    const values = splitList(m[2]).map(parseLiteral);
    if (!values.length || values.some((v) => !v || v.type !== values[0]!.type)) return undefined;
    return { property: unquote(m[1]), type: values[0]!.type, operator: 'in', values: values.map((v) => v!.value) };
  }
  m = clause.match(new RegExp(`^${IDENT}\\s+LIKE\\s+'%((?:[^'%]|'')*)%'$`, 'i'));
  if (m) return { property: unquote(m[1]), type: 'string', operator: 'like', values: [m[2].replace(/''/g, "'")] };
  m = clause.match(new RegExp(`^${IDENT}\\s*(<>|<=|>=|=|<|>)\\s*(.+)$`));
  if (m) {
    const lit = parseLiteral(m[3]);
    const operator = (Object.entries(OPERATOR_SYMBOLS).find(([, s]) => s === m![2])?.[0]) as StacPropertyOperator;
    return lit ? { property: unquote(m[1]), type: lit.type, operator, values: [lit.value] } : undefined;
  }
  return undefined;
};

export type StacCql2Filter = { rules: StacPropertyRule[] } | { raw: string };

/** Returns guided rules when every top-level AND clause is supported, otherwise the raw text. */
export const parseStacCql2Filter = (url: string): StacCql2Filter | undefined => {
  let filter: string | null = null;
  let query: string | null = null;
  try { const p = new URL(url).searchParams; filter = p.get('filter'); query = p.get('query'); } catch { return undefined; }
  if (query?.trim()) {
    const rules = parseStacQueryExtension(query);
    return rules ? { rules } : { raw: query };
  }
  if (!filter?.trim()) return undefined;
  const rules = splitTopLevelAnd(filter.trim()).map(parseClause);
  return rules.every(Boolean) ? { rules: rules as StacPropertyRule[] } : { raw: filter };
};

/**
 * Writes property filters into the URL. `style` defaults to the style the URL already uses,
 * then CQL2. The other style's parameters are always removed.
 */
export const updateStacCql2Filter = (
  url: string,
  filter: StacPropertyRule[] | string | undefined,
  style?: StacFilterStyle,
): string => {
  const parsed = new URL(url);
  const chosen = style ?? getStacFilterStyleFromUrl(url) ?? 'cql2';
  ['filter', 'filter-lang', 'query'].forEach((k) => parsed.searchParams.delete(k));
  const hasRules = Array.isArray(filter) && filter.length > 0;
  if (chosen === 'query') {
    const text = typeof filter === 'string' ? filter.trim() : hasRules ? serialiseStacQueryExtension(filter as StacPropertyRule[]) : '';
    if (text) parsed.searchParams.set('query', text);
  } else {
    const text = typeof filter === 'string' ? filter.trim() : hasRules ? serialiseCql2Rules(filter as StacPropertyRule[]) : '';
    if (text) {
      parsed.searchParams.set('filter', text);
      parsed.searchParams.set('filter-lang', 'cql2-text');
    }
  }
  return parsed.toString();
};

export const describeStacPropertyRule = (rule: StacPropertyRule): string => {
  if (rule.operator === 'between') return `${rule.property} ${rule.values[0]}–${rule.values[1]}`;
  if (rule.operator === 'in') return `${rule.property} ∈ {${rule.values.join(', ')}}`;
  return `${rule.property} ${STAC_OPERATOR_LABELS[rule.operator]} ${rule.values[0]}`;
};

/** Queryable shape as summarised by `summariseStacQueryables`. */
interface QueryableLike { type: string; enumValues?: unknown[] }

export const propertyTypeForQueryable = (q: QueryableLike): StacPropertyType => {
  if (/date-time|\(date\)/.test(q.type)) return 'datetime';
  if (/number|integer/.test(q.type)) return 'number';
  if (/boolean/.test(q.type)) return 'boolean';
  return 'string';
};

export const operatorsForQueryable = (q: QueryableLike): StacPropertyOperator[] => {
  if (q.enumValues?.length) return ['eq', 'in'];
  const type = propertyTypeForQueryable(q);
  if (type === 'boolean') return ['eq'];
  if (type === 'string') return ['eq', 'neq', 'like'];
  return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between'];
};

export const operatorsForType = (type: StacPropertyType): StacPropertyOperator[] =>
  operatorsForQueryable({ type: type === 'datetime' ? 'string (date-time)' : type });

/** Keys handled by dedicated controls and never offered as property filters. */
export const isDedicatedStacQueryable = (key: string) => ['datetime', 'geometry', 'bbox'].includes(key);

// ---------------------------------------------------------------------------
// STAC Query extension (`query={"prop":{"lt":5}}`), used by servers such as
// Element 84 Earth Search that do not implement CQL2 filtering.
// ---------------------------------------------------------------------------

export type StacFilterStyle = 'cql2' | 'query';

const QUERY_OPS: Partial<Record<StacPropertyOperator, string>> = {
  eq: 'eq', neq: 'neq', lt: 'lt', lte: 'lte', gt: 'gt', gte: 'gte', like: 'contains', in: 'in',
};

const typedValue = (type: StacPropertyType, value: string): unknown => {
  if (type === 'number') return Number(value);
  if (type === 'boolean') return value === 'true';
  return value;
};

export const serialiseStacQueryExtension = (rules: StacPropertyRule[]): string => {
  const out: Record<string, Record<string, unknown>> = {};
  for (const rule of rules) {
    const target = (out[rule.property] ??= {});
    if (rule.operator === 'between') {
      target.gte = typedValue(rule.type, rule.values[0]);
      target.lte = typedValue(rule.type, rule.values[1]);
    } else if (rule.operator === 'in') {
      target.in = rule.values.map((v) => typedValue(rule.type, v));
    } else {
      target[QUERY_OPS[rule.operator]!] = typedValue(rule.type, rule.values[0]);
    }
  }
  return JSON.stringify(out);
};

const typeOfValue = (value: unknown): StacPropertyType | undefined => {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}T/.test(value) ? 'datetime' : 'string';
  return undefined;
};

/** Parses a Query-extension JSON object into rules; undefined when any part is unsupported. */
export const parseStacQueryExtension = (text: string): StacPropertyRule[] | undefined => {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return undefined; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const rules: StacPropertyRule[] = [];
  for (const [property, ops] of Object.entries(data as Record<string, unknown>)) {
    if (!ops || typeof ops !== 'object' || Array.isArray(ops)) return undefined;
    const entries = { ...(ops as Record<string, unknown>) };
    if ('gte' in entries && 'lte' in entries && typeOfValue(entries.gte) && typeOfValue(entries.gte) === typeOfValue(entries.lte)) {
      rules.push({ property, type: typeOfValue(entries.gte)!, operator: 'between', values: [String(entries.gte), String(entries.lte)] });
      delete entries.gte; delete entries.lte;
    }
    for (const [op, value] of Object.entries(entries)) {
      if (op === 'in') {
        if (!Array.isArray(value) || !value.length) return undefined;
        const type = typeOfValue(value[0]);
        if (!type || value.some((v) => typeOfValue(v) !== type)) return undefined;
        rules.push({ property, type, operator: 'in', values: value.map(String) });
        continue;
      }
      const operator = (Object.entries(QUERY_OPS).find(([, q]) => q === op)?.[0]) as StacPropertyOperator | undefined;
      const type = typeOfValue(value);
      if (!operator || !type) return undefined;
      rules.push({ property, type: operator === 'like' ? 'string' : type, operator, values: [String(value)] });
    }
  }
  return rules;
};

/** Filter style already used by a URL, if any. */
export const getStacFilterStyleFromUrl = (url: string): StacFilterStyle | undefined => {
  try {
    const params = new URL(url).searchParams;
    if (params.get('query')?.trim()) return 'query';
    if (params.get('filter')?.trim()) return 'cql2';
  } catch { /* ignore */ }
  return undefined;
};

export interface StacFilterSupport { style: StacFilterStyle; advertised: boolean }
const filterSupportCache = new Map<string, Promise<StacFilterSupport>>();

/** Catalogue root of an items/search/collection URL. */
export const getStacApiRoot = (url: string): string => {
  const base = getStacUrlBase(url);
  const m = base.match(/^(.*?)\/(?:collections|search)(?:\/|$)/);
  return (m ? m[1] : base).replace(/\/$/, '') + '/';
};

/** Reads the catalogue's `conformsTo` and picks CQL2 filter or the Query extension. Cached per root. */
export const detectStacFilterSupport = (
  url: string,
  fetcher: FetchLike = fetch as unknown as FetchLike,
): Promise<StacFilterSupport> => {
  const root = getStacApiRoot(url);
  const cached = filterSupportCache.get(root);
  if (cached) return cached;
  const promise = (async (): Promise<StacFilterSupport> => {
    try {
      const response = await fetcher(root, { headers: { Accept: 'application/json' } });
      const data = response.ok ? await response.json() : null;
      const conforms: string[] = Array.isArray(data?.conformsTo) ? data.conformsTo : [];
      if (conforms.some((c) => /filter|cql2/i.test(c))) return { style: 'cql2', advertised: true };
      if (conforms.some((c) => /#query$/.test(c))) return { style: 'query', advertised: true };
    } catch { /* fall through */ }
    return { style: 'cql2', advertised: false };
  })();
  filterSupportCache.set(root, promise);
  return promise;
};
