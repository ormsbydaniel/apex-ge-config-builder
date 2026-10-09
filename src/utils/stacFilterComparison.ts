import {
  itemsUrlToSearchUrl,
  searchUrlToItemsUrl,
  updateStacCql2Filter,
  type StacPropertyRule,
} from '@/utils/stacQuery';

/** Fires the same query at items (unfiltered + filtered) and search (filtered) and compares behaviour. */

export type FilterVerdict = 'applied' | 'ignored' | 'unsupported' | 'unknown' | 'baseline';

export interface EndpointProbe {
  key: 'items-baseline' | 'items-filtered' | 'search-filtered';
  label: string;
  url: string;
  ok: boolean;
  error?: string;
  returned?: number;
  matched?: number;
  ids?: string[];
  /** Spot check against returned item properties: passed / checked. */
  spotCheck?: { passed: number; checked: number };
  verdict: FilterVerdict;
}

export interface FilterComparison {
  probes: EndpointProbe[];
  note?: string;
  summary: string;
  /** Set when switching to the search endpoint would make the filter work. */
  recommendSearch: boolean;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status?: number; json: () => Promise<any> }>;

const TIMEOUT_MS = 20_000;

const getProp = (props: Record<string, unknown> | undefined, key: string): unknown => {
  if (!props) return undefined;
  if (key in props) return props[key];
  const bare = key.includes(':') ? key.split(':').pop()! : undefined;
  if (bare && bare in props) return props[bare];
  const prefixed = Object.keys(props).find((k) => k.endsWith(`:${key}`));
  return prefixed ? props[prefixed] : undefined;
};

/** Returns true/false when the rule can be evaluated locally, undefined when it cannot. */
export const evaluateRule = (rule: StacPropertyRule, props: Record<string, unknown> | undefined): boolean | undefined => {
  const raw = getProp(props, rule.property);
  if (raw === undefined || raw === null) return undefined;
  const asComparable = (v: unknown): number | string | undefined => {
    if (rule.type === 'number') { const n = Number(v); return Number.isFinite(n) ? n : undefined; }
    if (rule.type === 'datetime') { const t = new Date(String(v)).getTime(); return Number.isNaN(t) ? undefined : t; }
    if (rule.type === 'boolean') return String(v) === 'true' ? 'true' : 'false';
    return String(v);
  };
  const actual = asComparable(raw);
  const values = rule.values.map(asComparable);
  if (actual === undefined || values.some((v) => v === undefined)) return undefined;
  const [a, b] = values as Array<number | string>;
  switch (rule.operator) {
    case 'eq': return actual === a;
    case 'neq': return actual !== a;
    case 'lt': return actual < a;
    case 'lte': return actual <= a;
    case 'gt': return actual > a;
    case 'gte': return actual >= a;
    case 'between': return actual >= a && actual <= b;
    case 'in': return values.includes(actual);
    case 'like': return String(actual).toLowerCase().includes(String(rule.values[0]).toLowerCase());
    default: return undefined;
  }
};

const spotCheck = (features: any[], rules: StacPropertyRule[] | undefined) => {
  if (!rules?.length || !features.length) return undefined;
  let checked = 0;
  let passed = 0;
  for (const f of features) {
    const results = rules.map((r) => evaluateRule(r, f?.properties));
    if (results.some((r) => r === undefined)) continue;
    checked += 1;
    if (results.every(Boolean)) passed += 1;
  }
  return checked ? { passed, checked } : undefined;
};

const probe = async (fetcher: FetchLike, key: EndpointProbe['key'], label: string, url: string, rules?: StacPropertyRule[]): Promise<EndpointProbe> => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : undefined;
  try {
    const response = await fetcher(url, { headers: { Accept: 'application/geo+json, application/json' }, signal: controller?.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { key, label, url, ok: false, verdict: 'unsupported', error: body?.description || body?.detail || body?.message || `Server returned ${response.status ?? 'an error'}` };
    }
    const features = Array.isArray(body?.features) ? body.features : [];
    const matched = body?.numberMatched ?? body?.context?.matched;
    return {
      key, label, url, ok: true,
      returned: features.length,
      matched: typeof matched === 'number' ? matched : undefined,
      ids: features.map((f: any) => String(f?.id ?? '')),
      spotCheck: spotCheck(features, rules),
      verdict: key === 'items-baseline' ? 'baseline' : 'unknown',
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return { key, label, url, ok: false, verdict: 'unsupported', error: aborted ? 'Timed out' : error instanceof Error ? error.message : String(error) };
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const sameResults = (a: EndpointProbe, b: EndpointProbe) =>
  a.ok && b.ok && a.returned === b.returned && (a.matched === undefined || b.matched === undefined || a.matched === b.matched)
  && a.ids!.slice(0, 10).join('|') === b.ids!.slice(0, 10).join('|');

/** Decide whether a filtered probe actually honoured the filter. */
export const judgeProbe = (filtered: EndpointProbe, baseline?: EndpointProbe): FilterVerdict => {
  if (!filtered.ok) return 'unsupported';
  if (filtered.spotCheck) {
    return filtered.spotCheck.passed === filtered.spotCheck.checked ? 'applied' : 'ignored';
  }
  if (!baseline?.ok) return 'unknown';
  const fewer = (filtered.matched !== undefined && baseline.matched !== undefined && filtered.matched < baseline.matched)
    || (filtered.returned! < baseline.returned!);
  if (fewer) return 'applied';
  if (sameResults(filtered, baseline)) return baseline.returned === 0 ? 'unknown' : 'ignored';
  return 'applied';
};

export async function compareStacFilterEndpoints(
  url: string,
  filter: StacPropertyRule[] | string,
  fetcher: FetchLike = fetch as unknown as FetchLike,
): Promise<FilterComparison> {
  const isSearch = /\/search\/?(\?|$)/.test(url.split('#')[0]);
  const itemsBase = isSearch ? searchUrlToItemsUrl(url) : url;
  const searchBase = isSearch ? url : itemsUrlToSearchUrl(url);
  const rules = Array.isArray(filter) ? filter : undefined;
  const filterEmpty = Array.isArray(filter) ? filter.length === 0 : !filter.trim();

  const tasks: Promise<EndpointProbe>[] = [];
  if (itemsBase) {
    tasks.push(probe(fetcher, 'items-baseline', 'Items, no filter', updateStacCql2Filter(itemsBase, undefined)));
    tasks.push(probe(fetcher, 'items-filtered', 'Items + filter', updateStacCql2Filter(itemsBase, filter), rules));
  }
  if (searchBase) {
    tasks.push(probe(fetcher, 'search-filtered', 'Search + filter', updateStacCql2Filter(searchBase, filter), rules));
  }
  const probes = await Promise.all(tasks);
  const baseline = probes.find((p) => p.key === 'items-baseline');
  for (const p of probes) if (p.key !== 'items-baseline') p.verdict = filterEmpty ? 'unknown' : judgeProbe(p, baseline);

  const items = probes.find((p) => p.key === 'items-filtered');
  const search = probes.find((p) => p.key === 'search-filtered');
  const note = !itemsBase
    ? 'This query covers several collections, so only the search endpoint can be tested.'
    : !searchBase ? 'This address cannot be converted to a search endpoint, so only items was tested.' : undefined;

  const current = isSearch ? search : items;
  const other = isSearch ? items : search;
  const recommendSearch = !isSearch && !!search && search.verdict === 'applied' && items?.verdict !== 'applied';
  let summary: string;
  if (current?.verdict === 'applied') summary = `The filter works on the ${isSearch ? 'search' : 'items'} endpoint you are using.`;
  else if (recommendSearch) summary = 'This service ignores filters on the items endpoint; switch to Search.';
  else if (isSearch && other?.verdict === 'applied') summary = 'The filter works on items but not search for this service; consider switching to Items.';
  else if (current?.verdict === 'ignored') summary = 'The filter appears to be ignored by this service.';
  else if (current?.verdict === 'unsupported') summary = 'The service rejected the filter.';
  else summary = 'Could not tell whether the filter was applied (no difference detectable).';

  return { probes, note, summary, recommendSearch };
}
