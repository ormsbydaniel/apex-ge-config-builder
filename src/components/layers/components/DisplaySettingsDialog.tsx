import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { useConfig } from '@/contexts/ConfigContext';
import ZoomPreviewMap from './ZoomPreviewMap';
import {
  BLEND_MODES, BlendMode, DISPLAY_KEYS, DisplaySettings, applyDisplaySettings, extractDisplaySettings,
} from '@/utils/displaySettings';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

const fileName = (item: DataSourceItem, i: number) => {
  const name = (item.url || '').split('?')[0].split('/').filter(Boolean).pop();
  return name || `Dataset ${i + 1}`;
};

const DisplaySettingsDialog = ({ open, onOpenChange, source, onUpdateDataSources }: Props) => {
  const { config } = useConfig();
  const data = source.data || [];
  const center = (config.mapConstraints?.center as [number, number] | undefined) || [0, 20];
  const baseZoom = config.mapConstraints?.zoom ?? 3;

  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [selected, setSelected] = useState<number[]>([]);
  const [s, setS] = useState<DisplaySettings>({});

  // Initialise on open only, so parent re-renders don't wipe edits.
  useEffect(() => {
    if (!open) return;
    setScope('all');
    setSelected(data.map((_, i) => i));
    setS(extractDisplaySettings(data[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const indices = scope === 'all' ? data.map((_, i) => i) : selected;
  const differs = useMemo(() => {
    const items = indices.map(i => data[i]).filter(Boolean);
    if (items.length < 2) return false;
    const first = extractDisplaySettings(items[0]);
    return items.some(it => DISPLAY_KEYS.some(k => extractDisplaySettings(it)[k] !== first[k]));
  }, [indices, data]);

  const zoomError = s.minZoom !== undefined && s.maxZoom !== undefined && s.minZoom > s.maxZoom;
  const opacityPct = Math.round((s.opacity ?? 1) * 100);

  const handleApply = () => {
    const set = new Set(indices);
    onUpdateDataSources(data.map((d, i) => (set.has(i) ? applyDisplaySettings(d, s) : d)));
    onOpenChange(false);
  };

  const numOrUndef = (v: string) => (v.trim() === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Display Settings</DialogTitle>
          <DialogDescription>Visibility range, opacity, stacking and blending for {source.name}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {data.length > 1 && (
            <section className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Apply to</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'all' | 'selected')} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="all" id="ds-all" /><Label htmlFor="ds-all" className="text-sm">All datasets ({data.length})</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="selected" id="ds-sel" /><Label htmlFor="ds-sel" className="text-sm">Selected datasets</Label></div>
              </RadioGroup>
              {scope === 'selected' && (
                <div className="max-h-32 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                  {data.map((d, i) => (
                    <label key={i} className="flex items-center gap-2 text-xs">
                      <Checkbox checked={selected.includes(i)} onCheckedChange={(c) => setSelected(prev => c ? [...prev, i] : prev.filter(x => x !== i))} />
                      <span className="truncate">{fileName(d, i)}</span>
                    </label>
                  ))}
                </div>
              )}
              {differs && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />These datasets have different settings; showing the first. Applying makes them the same.
                </p>
              )}
            </section>
          )}

          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Visible zoom range</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ZoomPreviewMap label="Furthest out (min zoom)" center={center} zoom={s.minZoom} fallbackZoom={Math.max(0, baseZoom - 1)} open={open}
                onChange={(z) => setS(p => ({ ...p, minZoom: z }))} />
              <ZoomPreviewMap label="Closest in (max zoom)" center={center} zoom={s.maxZoom} fallbackZoom={Math.min(20, baseZoom + 6)} open={open}
                onChange={(z) => setS(p => ({ ...p, maxZoom: z }))} />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Exact:</span>
              <Input className="h-7 w-20 text-xs" type="number" min={0} max={28} placeholder="min" value={s.minZoom ?? ''} onChange={(e) => setS(p => ({ ...p, minZoom: numOrUndef(e.target.value) }))} />
              <span>–</span>
              <Input className="h-7 w-20 text-xs" type="number" min={0} max={28} placeholder="max" value={s.maxZoom ?? ''} onChange={(e) => setS(p => ({ ...p, maxZoom: numOrUndef(e.target.value) }))} />
              {zoomError && <span className="text-destructive">Min zoom must not exceed max zoom</span>}
            </div>
          </section>

          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Opacity</Label>
            <div className="flex items-center gap-3">
              <Slider className="flex-1" min={0} max={100} step={1} value={[opacityPct]} onValueChange={([v]) => setS(p => ({ ...p, opacity: v / 100 }))} />
              <Input className="h-7 w-20 text-xs" type="number" min={0} max={100} value={opacityPct}
                onChange={(e) => { const n = numOrUndef(e.target.value); setS(p => ({ ...p, opacity: n === undefined ? undefined : Math.min(100, Math.max(0, n)) / 100 })); }} />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <section className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Stacking order (zIndex)</Label>
              <Input className="h-8 text-sm" type="number" value={s.zIndex ?? ''} onChange={(e) => setS(p => ({ ...p, zIndex: numOrUndef(e.target.value) }))} />
            </section>
            <section className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Blend mode</Label>
              <Select value={s.blendMode ?? 'normal'} onValueChange={(v) => setS(p => ({ ...p, blendMode: v as BlendMode }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLEND_MODES.map(m => <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </section>
          </div>
          <p className="text-[11px] text-muted-foreground">Blend modes only take effect if the Geospatial Explorer viewer supports them.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={zoomError || indices.length === 0}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisplaySettingsDialog;
