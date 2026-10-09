import React, { useEffect, useState } from 'react';
import { CalendarRange, Filter, Layers, Loader2, Map, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { compareStacFilterEndpoints, type FilterComparison, type FilterVerdict } from '@/utils/stacFilterComparison';
import PropertyFilterDialog from './PropertyFilterDialog';
import StacBboxMap from './StacBboxMap';
import {
  describeStacPropertyRule,
  getStacCollectionIds,

  inspectStacQueryTarget,
  isStacSearchUrl,
  itemsUrlToSearchUrl,
  parseStacCoreQuery,
  parseStacCql2Filter,
  searchUrlToItemsUrl,
  serialiseCql2Rule,
  toDateTimeLocalValue,
  toStacDateTime,
  updateStacCoreQuery,
  updateStacCql2Filter,
  validateBbox,
  type StacPropertyRule,
  type StacQueryTarget,
} from '@/utils/stacQuery';

interface StacQueryEditorProps {
  url: string;
  onChange: (url: string) => void;
}

const bboxLabels = ['West', 'South', 'East', 'North'];
const VERDICT_TEXT: Record<FilterVerdict, string> = {
  applied: 'applied', ignored: 'probably ignored', unsupported: 'not supported', unknown: 'unclear', baseline: '—',
};

const StacQueryEditor: React.FC<StacQueryEditorProps> = ({ url, onChange }) => {
  const initial = parseStacCoreQuery(url);
  const [target, setTarget] = useState<StacQueryTarget | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [targetError, setTargetError] = useState<string>();
  const [limit, setLimit] = useState(initial.limit ? String(initial.limit) : '');
  const [bbox, setBbox] = useState<string[]>(initial.bbox?.map(String) ?? ['', '', '', '']);
  const [start, setStart] = useState(toDateTimeLocalValue(initial.datetimeStart));
  const [end, setEnd] = useState(toDateTimeLocalValue(initial.datetimeEnd));
  const [bboxOpen, setBboxOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [propertyEdit, setPropertyEdit] = useState<{ index?: number; raw?: string } | null>(null);
  const [methodTest, setMethodTest] = useState<{ loading?: boolean; hasFilter: boolean; result?: FilterComparison; error?: string }>();

  const parsedQuery = parseStacCoreQuery(url);

  useEffect(() => {
    if (limitOpen) {
      const parsed = parseStacCoreQuery(url);
      setLimit(parsed.limit ? String(parsed.limit) : '');
    }
  }, [limitOpen, url]);

  useEffect(() => {
    const parsed = parseStacCoreQuery(url);
    setLimit(parsed.limit ? String(parsed.limit) : '');
    try {
      const parsed = new URL(url);
      if (/\/items\/[^/?#]+\/?$/.test(parsed.pathname)) setTarget({ kind: 'item' });
      else if (/\/items\/?$/.test(parsed.pathname)) setTarget({ kind: 'items', itemsUrl: url });
      else if (isStacSearchUrl(url)) setTarget({ kind: 'search', searchUrl: url, collectionId: parsed.searchParams.get('collections')! });
      else setTarget(null);
    } catch {
      setTarget(null);
    }
    setTargetError(undefined);
  }, [url]);

  const inspect = async () => {
    if (!url.trim()) return;
    setIsInspecting(true);
    setTargetError(undefined);
    try {
      const result = await inspectStacQueryTarget(url.trim());
      setTarget(result);
      if (result.kind === 'items' && result.itemsUrl !== url) {
        onChange(updateStacCoreQuery(result.itemsUrl, parseStacCoreQuery(url)));
      }
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsInspecting(false);
    }
  };

  const updateQuery = (changes: Partial<ReturnType<typeof parseStacCoreQuery>>) => {
    const base = target?.kind === 'items' ? target.itemsUrl : target?.kind === 'search' ? target.searchUrl : undefined;
    if (!base) return;
    onChange(updateStacCoreQuery(base, { ...parseStacCoreQuery(url), ...changes }));
  };

  const switchQueryMethod = (method: 'items' | 'search') => {
    if (target?.kind === method) return;
    const next = method === 'search' ? itemsUrlToSearchUrl(url) : searchUrlToItemsUrl(url);
    if (next) onChange(next);
  };

  // Results are keyed to the query only (not the endpoint), so they survive switching method.
  const queryKey = (() => { try { const u = new URL(url); ['collections'].forEach((k) => u.searchParams.delete(k)); return u.search; } catch { return url; } })();
  useEffect(() => { setMethodTest(undefined); }, [queryKey]);

  const runMethodTest = async () => {
    const f = parseStacCql2Filter(url);
    const filter = f ? ('raw' in f ? f.raw : f.rules) : [];
    const hasFilter = Boolean(f);
    setMethodTest({ loading: true, hasFilter });
    try {
      const result = await compareStacFilterEndpoints(url, filter);
      setMethodTest({ result, hasFilter });
    } catch (error) {
      setMethodTest({ hasFilter, error: error instanceof Error ? error.message : String(error) });
    }
  };

  const applyLimit = () => {
    if (limit === '') {
      updateQuery({ limit: undefined });
      return;
    }
    if (/^\d+$/.test(limit) && Number(limit) > 0) updateQuery({ limit: Number(limit) });
  };

  const openBboxDialog = () => {
    setBbox(parsedQuery.bbox?.map(String) ?? ['', '', '', '']);
    setBboxOpen(true);
  };

  const openDateDialog = () => {
    setStart(toDateTimeLocalValue(parsedQuery.datetimeStart));
    setEnd(toDateTimeLocalValue(parsedQuery.datetimeEnd));
    setDateOpen(true);
  };

  const bboxError = validateBbox(bbox);
  const limitError = limit !== '' && (!/^\d+$/.test(limit) || Number(limit) <= 0)
    ? 'Enter a positive whole number.'
    : undefined;
  const dateError = start && end && new Date(start) > new Date(end)
    ? 'Start must not be after end.'
    : undefined;
  const queryable = target?.kind === 'items' || target?.kind === 'search';
  const collectionIds = queryable ? getStacCollectionIds(url) : [];
  const collectionSummary = collectionIds.length > 1 ? `${collectionIds[0]} +${collectionIds.length - 1} more` : collectionIds[0] ?? '';

  const canSwitchToSearch = target?.kind === 'items' && itemsUrlToSearchUrl(url) !== undefined;
  const canSwitchToItems = target?.kind === 'search' && searchUrlToItemsUrl(url) !== undefined;
  const cql2 = parseStacCql2Filter(url);
  const rules = cql2 && 'rules' in cql2 ? cql2.rules : [];
  const openPropertyDialog = (edit: { index?: number; raw?: string }) => setPropertyEdit(edit);
  const saveFilter = (filter: StacPropertyRule[] | string | undefined) => {
    try { onChange(updateStacCql2Filter(url, filter)); } catch { /* invalid URL */ }
  };

  const dateSummary = parsedQuery.datetimeStart || parsedQuery.datetimeEnd
    ? `${parsedQuery.datetimeStart ? new Date(parsedQuery.datetimeStart).toLocaleString() : 'Open start'} → ${parsedQuery.datetimeEnd ? new Date(parsedQuery.datetimeEnd).toLocaleString() : 'Open end'}`
    : '';
  const bboxSummary = parsedQuery.bbox?.join(', ') ?? '';

  return (
    <div className="space-y-3">
      {isInspecting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking this STAC source…</p>}
      {targetError && <p className="text-sm text-destructive">{targetError}</p>}
      {!target && !isInspecting && (
        <Button type="button" variant="outline" size="sm" disabled={!url.trim()} onClick={() => void inspect()}>
          Check source for filters
        </Button>
      )}
      {target?.kind === 'item' && <p className="text-sm text-muted-foreground">Filters do not apply to a single fixed item.</p>}
      {target?.kind === 'static' && <p className="text-sm text-muted-foreground">This source does not advertise an items endpoint for server-side filtering.</p>}

      <div className="flex flex-wrap gap-2">
        {collectionIds.length > 0 && (
          <Badge variant="outline" className="gap-1 py-1 px-2 text-xs font-normal text-muted-foreground"
            title={collectionIds.length > 1 ? `Collections: ${collectionIds.join(', ')}` : `Collection: ${collectionIds[0]}`}>
            <Layers className="h-3 w-3" />{collectionSummary}
          </Badge>
        )}

          <Badge variant="secondary" className="gap-1 py-1 pl-1 pr-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-xs" disabled={!queryable} onClick={() => setLimitOpen(true)}>
              Result limit: {parsedQuery.limit}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={!queryable} aria-label="Remove result limit" onClick={() => updateQuery({ limit: undefined })}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={!queryable} onClick={() => setLimitOpen(true)}>+ Result limit</Button>
        )}
        {parsedQuery.datetimeStart || parsedQuery.datetimeEnd ? (
          <Badge variant="secondary" className="gap-1 py-1 pl-1 pr-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs" onClick={openDateDialog}>
              <CalendarRange className="h-3 w-3" />{dateSummary}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Remove date filter" onClick={() => updateQuery({ datetimeStart: undefined, datetimeEnd: undefined })}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={!queryable} onClick={openDateDialog}>+ Add date filter</Button>
        )}

        {parsedQuery.bbox ? (
          <Badge variant="secondary" className="gap-1 py-1 pl-1 pr-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs" onClick={openBboxDialog}>
              <Map className="h-3 w-3" />{bboxSummary}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Remove bbox filter" onClick={() => updateQuery({ bbox: undefined })}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={!queryable} onClick={openBboxDialog}>+ Add bbox filter</Button>
        )}

        {cql2 && 'raw' in cql2 && (
          <Badge variant="secondary" className="gap-1 py-1 pl-1 pr-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs" title={cql2.raw} onClick={() => openPropertyDialog({ raw: cql2.raw })}>
              <Filter className="h-3 w-3" />Custom filter
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Remove custom filter" onClick={() => saveFilter(undefined)}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {rules.map((rule, index) => (
          <Badge key={`${rule.property}-${index}`} variant="secondary" className="gap-1 py-1 pl-1 pr-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs" title={serialiseCql2Rule(rule)} onClick={() => openPropertyDialog({ index })}>
              <Filter className="h-3 w-3" />{describeStacPropertyRule(rule)}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label={`Remove ${rule.property} filter`} onClick={() => saveFilter(rules.filter((_, i) => i !== index))}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        {!(cql2 && 'raw' in cql2) && (
          <Button type="button" variant="outline" size="sm" disabled={!queryable} onClick={() => openPropertyDialog({})}>+ Add property filter</Button>
        )}
      </div>

      {queryable && target && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Query method</Label>
            <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={methodTest?.loading} onClick={() => void runMethodTest()}>
              {methodTest?.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Test'}
            </Button>
          </div>
          <RadioGroup value={target.kind} onValueChange={(v) => switchQueryMethod(v as 'items' | 'search')} className="gap-2">
            {(['items', 'search'] as const).map((method) => {
              const disabled = method === 'items' ? target.kind === 'search' && !canSwitchToItems : target.kind === 'items' && !canSwitchToSearch;
              const probe = methodTest?.result?.probes.find((p) => p.key === (method === 'items' ? (methodTest.hasFilter ? 'items-filtered' : 'items-baseline') : 'search-filtered'));
              return (
                <div key={method} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <RadioGroupItem id={`stac-method-${method}`} value={method} disabled={disabled} />
                  <Label htmlFor={`stac-method-${method}`} className={`text-sm font-normal ${disabled ? 'text-muted-foreground' : ''}`}
                    title={disabled ? (method === 'items' ? 'Only single-collection searches can switch to the items endpoint.' : 'This items address cannot be converted to a search request.') : undefined}>
                    {method === 'items' ? 'Items endpoint' : 'Search endpoint'}
                  </Label>
                  {methodTest?.result && (
                    <span className="text-xs text-muted-foreground" title={probe?.url}>
                      {!probe ? 'Not tested for this address.'
                        : !probe.ok ? <span className="text-destructive">{probe.error}</span>
                        : <>
                            {probe.returned} returned{probe.matched !== undefined ? `, ${probe.matched} matched` : ''}
                            {methodTest.hasFilter && <> · filter <span className={probe.verdict === 'applied' ? 'text-primary' : probe.verdict === 'ignored' || probe.verdict === 'unsupported' ? 'text-destructive' : ''}>{VERDICT_TEXT[probe.verdict]}</span></>}
                            {probe.spotCheck && ` (${probe.spotCheck.passed}/${probe.spotCheck.checked} items pass)`}
                          </>}
                    </span>
                  )}
                </div>

              );
            })}
          </RadioGroup>
          {methodTest?.error && <p className="text-xs text-destructive">{methodTest.error}</p>}
          <p className="text-xs text-muted-foreground">Some servers only apply property filters on the search endpoint. Test uses the current dates, area, limit and filters (first page only).</p>
        </div>
      )}

      {queryable && target && (
        <PropertyFilterDialog
          open={propertyEdit !== null}
          onOpenChange={(open) => { if (!open) setPropertyEdit(null); }}
          itemsUrl={target.kind === 'items' ? target.itemsUrl : target.searchUrl}
          otherRules={rules.filter((_, i) => i !== propertyEdit?.index)}
          initialRule={propertyEdit?.index !== undefined ? rules[propertyEdit.index] : undefined}
          initialRaw={propertyEdit?.raw}
          onSwitchToSearch={canSwitchToSearch ? () => switchQueryMethod('search') : undefined}
          onSave={(value) => {
            if (typeof value === 'string') saveFilter(value);
            else if (propertyEdit?.index !== undefined) saveFilter(rules.map((r, i) => (i === propertyEdit.index ? value : r)));
            else saveFilter([...rules, value]);
          }}
        />
      )}

      {url.trim() && (
        <div className="space-y-1">
          <Label className="text-muted-foreground">Formulated URL</Label>
          <p className="overflow-hidden break-all text-xs text-muted-foreground">{url}</p>
        </div>
      )}

      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Result limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="stac-limit">Result limit</Label>
            <Input id="stac-limit" type="number" min="1" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} autoComplete="off" />
            {limitError && <p className="text-xs text-destructive">{limitError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLimitOpen(false)}>Cancel</Button>
            <Button type="button" disabled={Boolean(limitError) || !queryable || limit === ''} onClick={() => {
              applyLimit();
              setLimitOpen(false);
            }}>Save limit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dateOpen} onOpenChange={setDateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Date filter</DialogTitle>
            <DialogDescription>Set a start, an end, or both. Leave one side empty for an open interval.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="stac-datetime-start">Start date and time</Label><Input id="stac-datetime-start" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="stac-datetime-end">End date and time</Label><Input id="stac-datetime-end" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></div>
          </div>
          {dateError && <p className="text-xs text-destructive">{dateError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDateOpen(false)}>Cancel</Button>
            <Button type="button" disabled={Boolean(dateError) || (!start && !end)} onClick={() => {
              updateQuery({ datetimeStart: toStacDateTime(start), datetimeEnd: toStacDateTime(end) });
              setDateOpen(false);
            }}>Save filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bboxOpen} onOpenChange={setBboxOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bounding box filter</DialogTitle>
            <DialogDescription>Draw a rectangle on the map, or enter west, south, east, and north coordinates. Items whose geometry intersects this area are returned.</DialogDescription>
          </DialogHeader>
          {bboxOpen && <StacBboxMap value={bbox} onChange={setBbox} open={bboxOpen} />}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {bboxLabels.map((label, index) => (
              <div key={label} className="space-y-2">
                <Label htmlFor={`stac-bbox-${index}`}>{label}</Label>
                <Input id={`stac-bbox-${index}`} type="number" step="any" value={bbox[index]} onChange={(event) => setBbox(bbox.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} autoComplete="off" />
              </div>
            ))}
          </div>
          {bboxError && <p className="text-xs text-destructive">{bboxError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBboxOpen(false)}>Cancel</Button>
            <Button type="button" disabled={Boolean(bboxError) || bbox.every((value) => value.trim() === '')} onClick={() => {
              updateQuery({ bbox: bbox.map(Number) as [number, number, number, number] });
              setBboxOpen(false);
            }}>Save filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StacQueryEditor;
