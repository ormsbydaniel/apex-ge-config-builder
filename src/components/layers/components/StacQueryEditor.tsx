import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { cn } from '@/lib/utils';

interface StacQueryEditorProps {
  url: string;
  onChange: (url: string) => void;
}

const labels = ['West', 'South', 'East', 'North'];

const StacQueryEditor: React.FC<StacQueryEditorProps> = ({ url, onChange }) => {
  const initial = parseStacCoreQuery(url);
  const [open, setOpen] = useState(Boolean(initial.bbox || initial.datetimeStart || initial.datetimeEnd || initial.limit));
  const [target, setTarget] = useState<StacQueryTarget | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [targetError, setTargetError] = useState<string>();
  const [bbox, setBbox] = useState<string[]>(initial.bbox?.map(String) ?? ['', '', '', '']);
  const [start, setStart] = useState(toDateTimeLocalValue(initial.datetimeStart));
  const [end, setEnd] = useState(toDateTimeLocalValue(initial.datetimeEnd));
  const [limit, setLimit] = useState(initial.limit ? String(initial.limit) : '');

  useEffect(() => {
    const parsed = parseStacCoreQuery(url);
    setBbox(parsed.bbox?.map(String) ?? ['', '', '', '']);
    setStart(toDateTimeLocalValue(parsed.datetimeStart));
    setEnd(toDateTimeLocalValue(parsed.datetimeEnd));
    setLimit(parsed.limit ? String(parsed.limit) : '');
    setTarget(null);
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
        const current = parseStacCoreQuery(url);
        onChange(updateStacCoreQuery(result.itemsUrl, current));
      }
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsInspecting(false);
    }
  };

  const apply = () => {
    if (!target || target.kind !== 'items') return;
    const bboxError = validateBbox(bbox);
    const parsedLimit = limit === '' ? undefined : Number(limit);
    if (bboxError || (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit <= 0))) return;
    const hasBbox = bbox.some((value) => value.trim() !== '');
    onChange(updateStacCoreQuery(target.itemsUrl, {
      bbox: hasBbox ? bbox.map(Number) as [number, number, number, number] : undefined,
      datetimeStart: toStacDateTime(start),
      datetimeEnd: toStacDateTime(end),
      limit: parsedLimit,
    }));
  };

  const bboxError = validateBbox(bbox);
  const limitError = limit !== '' && (!/^\d+$/.test(limit) || Number(limit) <= 0)
    ? 'Enter a positive whole number.'
    : undefined;
  const dateError = start && end && new Date(start) > new Date(end)
    ? 'Start must not be after end.'
    : undefined;
  const canApply = target?.kind === 'items' && !bboxError && !limitError && !dateError;

  return (
    <Collapsible open={open} onOpenChange={(next) => { setOpen(next); if (next && !target) void inspect(); }}>
      <div className="rounded-md border">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full justify-between px-3">
            Filter items
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t p-3">
          {isInspecting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking this STAC source…</p>}
          {targetError && <p className="text-sm text-destructive">{targetError}</p>}
          {target?.kind === 'item' && <p className="text-sm text-muted-foreground">Filters do not apply to a single fixed item.</p>}
          {target?.kind === 'static' && <p className="text-sm text-muted-foreground">This source does not advertise an items endpoint for server-side filtering.</p>}
          {target?.kind === 'items' && (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Area</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {labels.map((label, index) => (
                    <div key={label} className="space-y-1">
                      <Label htmlFor={`stac-bbox-${index}`} className="text-xs">{label}</Label>
                      <Input id={`stac-bbox-${index}`} type="number" step="any" value={bbox[index]} onChange={(event) => setBbox(bbox.map((value, i) => i === index ? event.target.value : value))} autoComplete="off" />
                    </div>
                  ))}
                </div>
                {bboxError && <p className="text-xs text-destructive">{bboxError}</p>}
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="stac-datetime-start">Start date and time</Label><Input id="stac-datetime-start" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="stac-datetime-end">End date and time</Label><Input id="stac-datetime-end" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></div>
              </div>
              {dateError && <p className="text-xs text-destructive">{dateError}</p>}
              <div className="space-y-1 sm:max-w-40">
                <Label htmlFor="stac-limit">Result limit</Label>
                <Input id="stac-limit" type="number" min="1" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} autoComplete="off" />
                {limitError && <p className="text-xs text-destructive">{limitError}</p>}
              </div>
              <div className="flex justify-end"><Button type="button" variant="outline" disabled={!canApply} onClick={apply}>Apply filters</Button></div>
            </>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default StacQueryEditor;