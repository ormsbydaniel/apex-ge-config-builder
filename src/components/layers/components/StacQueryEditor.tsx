import React, { useEffect, useState } from 'react';
import { CalendarRange, Loader2, Map, X } from 'lucide-react';
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
import {
  inspectStacQueryTarget,
  parseStacCoreQuery,
  toDateTimeLocalValue,
  toStacDateTime,
  updateStacCoreQuery,
  validateBbox,
  type StacQueryTarget,
} from '@/utils/stacQuery';

interface StacQueryEditorProps {
  url: string;
  onChange: (url: string) => void;
}

const bboxLabels = ['West', 'South', 'East', 'North'];

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
      const pathname = new URL(url).pathname;
      if (/\/items\/[^/?#]+\/?$/.test(pathname)) setTarget({ kind: 'item' });
      else if (/\/items\/?$/.test(pathname)) setTarget({ kind: 'items', itemsUrl: url });
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
    if (target?.kind !== 'items') return;
    onChange(updateStacCoreQuery(target.itemsUrl, { ...parseStacCoreQuery(url), ...changes }));
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
  const queryable = target?.kind === 'items';

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
        {parsedQuery.limit ? (
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
      </div>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bounding box filter</DialogTitle>
            <DialogDescription>Enter west, south, east, and north coordinates.</DialogDescription>
          </DialogHeader>
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
