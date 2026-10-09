import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getCachedStacQueryables, summariseStacQueryables, type StacQueryable } from '@/utils/stacMetadata';
import {
  STAC_OPERATOR_LABELS,
  isDedicatedStacQueryable,
  operatorsForQueryable,
  operatorsForType,
  propertyTypeForQueryable,
  serialiseCql2Rule,
  updateStacCql2Filter,
  type StacPropertyOperator,
  type StacPropertyRule,
  type StacPropertyType,
} from '@/utils/stacQuery';
import { compareStacFilterEndpoints, type FilterComparison, type FilterVerdict } from '@/utils/stacFilterComparison';

interface PropertyFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Items or search URL the filter applies to (used for queryables and the test request). */
  itemsUrl: string;
  /** Rules that remain alongside the one being edited, so Test filter checks the full query. */
  otherRules: StacPropertyRule[];
  initialRule?: StacPropertyRule;
  /** When set, the dialog edits a raw CQL2 expression instead of a guided rule. */
  initialRaw?: string;
  onSave: (value: StacPropertyRule | string) => void;
  /** Offered when the test shows only the search endpoint honours the filter. */
  onSwitchToSearch?: () => void;
}

const VERDICT_LABEL: Record<FilterVerdict, string> = {
  applied: 'Applied', ignored: 'Probably ignored', unsupported: 'Not supported', unknown: 'Unclear', baseline: 'No property filter',
};
const VERDICT_CLASS: Record<FilterVerdict, string> = {
  applied: 'text-primary', ignored: 'text-destructive', unsupported: 'text-destructive', unknown: 'text-muted-foreground', baseline: 'text-muted-foreground',
};

const MANUAL = '__manual__';
const TYPES: StacPropertyType[] = ['string', 'number', 'datetime', 'boolean'];

const PropertyFilterDialog: React.FC<PropertyFilterDialogProps> = ({ open, onOpenChange, itemsUrl, otherRules, initialRule, initialRaw, onSave, onSwitchToSearch }) => {
  const rawMode = initialRaw !== undefined;
  const [queryables, setQueryables] = useState<StacQueryable[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const [selectedKey, setSelectedKey] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [manualType, setManualType] = useState<StacPropertyType>('string');
  const [operator, setOperator] = useState<StacPropertyOperator>('eq');
  const [values, setValues] = useState<string[]>(['', '']);
  const [raw, setRaw] = useState('');
  const [testResult, setTestResult] = useState<{ loading?: boolean; message?: string; error?: boolean }>({});
  const [comparison, setComparison] = useState<FilterComparison | undefined>();

  // Reset the form only when the dialog opens, so switching endpoint mid-edit keeps entries.
  useEffect(() => {
    if (!open) return;
    setTestResult({});
    setComparison(undefined);
    setRaw(initialRaw ?? '');
    setOperator(initialRule?.operator ?? 'eq');
    setValues(initialRule ? [...initialRule.values, '', ''].slice(0, Math.max(2, initialRule.values.length)) : ['', '']);
    setManualKey(initialRule?.property ?? '');
    setManualType(initialRule?.type ?? 'string');
    setSelectedKey(initialRule?.property ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || rawMode) return;
    setLoadState('loading');
    let cancelled = false;
    getCachedStacQueryables(itemsUrl)
      .then((schema) => {
        if (cancelled) return;
        const list = summariseStacQueryables(schema).filter((q) => !isDedicatedStacQueryable(q.key));
        setQueryables(list);
        setLoadState(list.length ? 'ready' : 'failed');
        setSelectedKey((current) => (current && current !== MANUAL && !list.some((q) => q.key === current) ? MANUAL : current));
      })
      .catch(() => {
        if (cancelled) return;
        setQueryables([]);
        setLoadState('failed');
        setSelectedKey(MANUAL);
      });
    return () => { cancelled = true; };
  }, [open, itemsUrl, rawMode]);

  const manual = selectedKey === MANUAL || loadState === 'failed';
  const queryable = manual ? undefined : queryables.find((q) => q.key === selectedKey);
  const type: StacPropertyType = manual ? manualType : queryable ? propertyTypeForQueryable(queryable) : 'string';
  const operators = queryable ? operatorsForQueryable(queryable) : operatorsForType(type);
  const enumValues = queryable?.enumValues?.map(String);
  const property = manual ? manualKey.trim() : selectedKey;

  useEffect(() => {
    if (!operators.includes(operator)) setOperator(operators[0]);
  }, [operators, operator]);

  const rule: StacPropertyRule | undefined = useMemo(() => {
    if (!property) return undefined;
    const needed = operator === 'between' ? values.slice(0, 2) : operator === 'in' ? values.filter((v) => v !== '') : values.slice(0, 1);
    if (!needed.length || needed.some((v) => v.trim() === '')) return undefined;
    if (type === 'number' && needed.some((v) => !Number.isFinite(Number(v)))) return undefined;
    if (type === 'datetime' && needed.some((v) => Number.isNaN(new Date(v).getTime()))) return undefined;
    const normalised = type === 'datetime' ? needed.map((v) => new Date(v).toISOString()) : needed;
    return { property, type, operator, values: normalised };
  }, [property, type, operator, values]);

  const rangeHint = queryable?.range ? `Allowed range: ${queryable.range}` : undefined;
  const canSave = rawMode ? raw.trim() !== '' : Boolean(rule);

  const testFilter = async () => {
    const filter = rawMode ? raw : rule ? [...otherRules, rule] : otherRules;
    setTestResult({ loading: true });
    setComparison(undefined);
    try {
      const result = await compareStacFilterEndpoints(itemsUrl, filter);
      setComparison(result);
      setTestResult({});
    } catch (error) {
      setTestResult({ error: true, message: error instanceof Error ? error.message : String(error) });
    }
  };

  const setValue = (index: number, value: string) => setValues((current) => current.map((v, i) => (i === index ? value : v)));
  const inputType = type === 'number' ? 'number' : type === 'datetime' ? 'datetime-local' : 'text';
  const toInputValue = (v: string) => {
    if (type !== 'datetime' || !v) return v;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };

  const renderValueInput = (index: number, id: string) => {
    if (type === 'boolean') {
      return (
        <Select value={values[index]} onValueChange={(v) => setValue(index, v)}>
          <SelectTrigger id={id}><SelectValue placeholder="Choose…" /></SelectTrigger>
          <SelectContent><SelectItem value="true">true</SelectItem><SelectItem value="false">false</SelectItem></SelectContent>
        </Select>
      );
    }
    if (enumValues?.length) {
      return (
        <Select value={values[index]} onValueChange={(v) => setValue(index, v)}>
          <SelectTrigger id={id}><SelectValue placeholder="Choose a value…" /></SelectTrigger>
          <SelectContent>{enumValues.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return (
      <Input id={id} type={inputType} step="any" autoComplete="off" value={toInputValue(values[index] ?? '')} onChange={(e) => setValue(index, e.target.value)} />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rawMode ? 'Custom filter' : 'Property filter'}</DialogTitle>
          <DialogDescription>
            {rawMode
              ? 'This filter cannot be broken into simple rules. It will be kept exactly as entered (CQL2 text).'
              : 'Filter items by a property the collection publishes. Rules are combined with AND.'}
          </DialogDescription>
        </DialogHeader>

        {rawMode ? (
          <div className="space-y-2">
            <Label htmlFor="stac-cql2-raw">CQL2 expression</Label>
            <Textarea id="stac-cql2-raw" rows={4} className="font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            {loadState === 'loading' && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading collection queryables…</p>}
            {loadState === 'failed' && <p className="text-xs text-muted-foreground">This collection's filterable properties could not be discovered. Enter the property name and type yourself.</p>}

            {loadState === 'ready' && (
              <div className="space-y-2">
                <Label htmlFor="stac-prop-key">Property</Label>
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger id="stac-prop-key"><SelectValue placeholder="Choose a property…" /></SelectTrigger>
                  <SelectContent>
                    {queryables.map((q) => (
                      <SelectItem key={q.key} value={q.key}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs">{q.key}</span>
                          {q.title && q.title !== q.key && <span className="text-muted-foreground">{q.title}</span>}
                          <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value={MANUAL}>Enter another property…</SelectItem>
                  </SelectContent>
                </Select>
                {queryable?.description && <p className="text-xs text-muted-foreground">{queryable.description}</p>}
              </div>
            )}

            {manual && loadState !== 'loading' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="stac-prop-manual">Property name</Label>
                  <Input id="stac-prop-manual" autoComplete="off" placeholder="e.g. eo:cloud_cover" value={manualKey} onChange={(e) => setManualKey(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stac-prop-type">Type</Label>
                  <Select value={manualType} onValueChange={(v) => setManualType(v as StacPropertyType)}>
                    <SelectTrigger id="stac-prop-type" className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t === 'datetime' ? 'date/time' : t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {property && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stac-prop-op">Condition</Label>
                  <Select value={operator} onValueChange={(v) => setOperator(v as StacPropertyOperator)}>
                    <SelectTrigger id="stac-prop-op"><SelectValue /></SelectTrigger>
                    <SelectContent>{operators.map((op) => <SelectItem key={op} value={op}>{STAC_OPERATOR_LABELS[op]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {operator === 'in' && enumValues?.length ? (
                  <div className="space-y-2">
                    <Label>Values</Label>
                    <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                      {enumValues.map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={values.includes(v)}
                            onCheckedChange={(checked) => setValues((current) => (checked ? [...current.filter(Boolean), v] : current.filter((x) => x !== v)))}
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : operator === 'in' ? (
                  <div className="space-y-2">
                    <Label htmlFor="stac-prop-list">Values (comma separated)</Label>
                    <Input id="stac-prop-list" autoComplete="off" value={values.filter(Boolean).join(', ')} onChange={(e) => setValues(e.target.value.split(',').map((s) => s.trim()))} />
                  </div>
                ) : operator === 'between' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="stac-prop-from">From</Label>{renderValueInput(0, 'stac-prop-from')}</div>
                    <div className="space-y-2"><Label htmlFor="stac-prop-to">To</Label>{renderValueInput(1, 'stac-prop-to')}</div>
                  </div>
                ) : (
                  <div className="space-y-2"><Label htmlFor="stac-prop-value">Value</Label>{renderValueInput(0, 'stac-prop-value')}</div>
                )}
                {rangeHint && <p className="text-xs text-muted-foreground">{rangeHint}</p>}
                {rule && <p className="break-all font-mono text-xs text-muted-foreground">{serialiseCql2Rule(rule)}</p>}
              </>
            )}
          </div>
        )}

        {testResult.loading && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Testing…</p>}
        {testResult.message && <p className={`text-xs ${testResult.error ? 'text-destructive' : 'text-muted-foreground'}`}>{testResult.message}</p>}
        {comparison && (
          <div className="space-y-2 rounded-md border p-2 text-xs">
            <table className="w-full">
              <thead className="text-muted-foreground">
                <tr><th className="text-left font-normal">Endpoint</th><th className="text-right font-normal">Returned</th><th className="text-right font-normal">Matched</th><th className="text-right font-normal">Property filter</th></tr>
              </thead>
              <tbody>
                {comparison.probes.map((p) => (
                  <tr key={p.key} title={p.url}>
                    <td className="py-0.5">{p.label}</td>
                    {p.ok ? (
                      <>
                        <td className="text-right">{p.returned}</td>
                        <td className="text-right">{p.matched ?? '—'}</td>
                      </>
                    ) : (
                      <td colSpan={2} className="truncate text-right text-destructive" title={p.error}>{p.error}</td>
                    )}
                    <td className={`text-right ${VERDICT_CLASS[p.verdict]}`}>
                      {VERDICT_LABEL[p.verdict]}
                      {p.spotCheck && <span className="block text-[10px] text-muted-foreground">{p.spotCheck.passed}/{p.spotCheck.checked} items pass</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {comparison.note && <p className="text-muted-foreground">{comparison.note}</p>}
            <p className="text-muted-foreground">The 'no property filter' row shows what the query returns with only the area, date range and limit applied — use it as the comparison for the filtered rows.</p>
            {comparison.zeroResults && (
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                This query returns no items, so the layer will not display on the map. Try relaxing the property filter, widening the date range or area, or raising the limit.
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{comparison.summary}</p>
              {comparison.recommendSearch && onSwitchToSearch && (
                <Button type="button" size="sm" variant="secondary" onClick={() => { onSwitchToSearch(); setComparison(undefined); }}>Use search endpoint</Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">First page only; counts are capped by the limit unless the service reports a total.</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" size="sm" disabled={!canSave || testResult.loading} onClick={() => void testFilter()}>Test filter</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={!canSave} onClick={() => { onSave(rawMode ? raw.trim() : rule!); onOpenChange(false); }}>Save filter</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFilterDialog;
