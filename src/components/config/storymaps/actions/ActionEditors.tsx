import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2 } from 'lucide-react';
import type {
  DataSource,
  StoryStep,
  StoryStepControl,
  StoryConstraintSelection,
  ConstraintSourceItem,
} from '@/types/config';

// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------

export interface LayerOption {
  id: string;
  name: string;
}

const isZoomViewport = (v: any): v is { zoom: number; center: [number, number]; duration?: number } =>
  v && typeof v === 'object' && 'zoom' in v;

const findSource = (sources: DataSource[], ref: string | undefined): DataSource | undefined => {
  if (!ref) return undefined;
  const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');
  return (
    sources.find((s) => s.id === ref) ??
    sources.find((s) => s.name === ref) ??
    sources.find((s) => slug(s.name) === slug(ref))
  );
};

// Render a friendly label for an option: name followed by muted id.
const optionLabel = (opt: LayerOption) => opt.name || opt.id;

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: () => void;
  canSave?: boolean;
  children: React.ReactNode;
  wide?: boolean;
}

const ActionModal: React.FC<BaseModalProps> = ({
  open, onOpenChange, title, onSave, canSave = true, children, wide,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={wide ? 'sm:max-w-[720px]' : 'sm:max-w-[560px]'}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">{children}</div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={onSave} disabled={!canSave}>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// -----------------------------------------------------------------------------
// Navigation editor
// -----------------------------------------------------------------------------

interface NavigationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  layerOptions: LayerOption[];
  onSave: (viewport: StoryStep['viewport']) => void;
}

export const NavigationEditor: React.FC<NavigationEditorProps> = ({
  open, onOpenChange, step, layerOptions, onSave,
}) => {
  const [kind, setKind] = useState<'zoom' | 'fit'>(isZoomViewport(step.viewport) ? 'zoom' : 'fit');
  const [zoom, setZoom] = useState<number>(isZoomViewport(step.viewport) ? step.viewport.zoom : 6);
  const [lon, setLon] = useState<number>(isZoomViewport(step.viewport) ? step.viewport.center[0] : 0);
  const [lat, setLat] = useState<number>(isZoomViewport(step.viewport) ? step.viewport.center[1] : 0);
  const [duration, setDuration] = useState<string>(
    isZoomViewport(step.viewport) && step.viewport.duration !== undefined
      ? String(step.viewport.duration) : ''
  );
  const [fitLayer, setFitLayer] = useState<string>(
    !isZoomViewport(step.viewport) ? (step.viewport as any).fitLayer ?? '' : (layerOptions[0]?.id ?? '')
  );

  useEffect(() => {
    if (!open) return;
    setKind(isZoomViewport(step.viewport) ? 'zoom' : 'fit');
    if (isZoomViewport(step.viewport)) {
      setZoom(step.viewport.zoom);
      setLon(step.viewport.center[0]);
      setLat(step.viewport.center[1]);
      setDuration(step.viewport.duration !== undefined ? String(step.viewport.duration) : '');
    } else {
      setFitLayer((step.viewport as any).fitLayer ?? layerOptions[0]?.id ?? '');
    }
  }, [open, step, layerOptions]);

  const save = () => {
    if (kind === 'zoom') {
      onSave({
        zoom, center: [lon, lat],
        duration: duration === '' ? undefined : Number(duration),
      });
    } else {
      onSave({ fitLayer });
    }
    onOpenChange(false);
  };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Navigation" onSave={save}>
      <RadioGroup value={kind} onValueChange={(v) => setKind(v as any)} className="flex gap-4">
        <label className="flex items-center gap-1 text-sm">
          <RadioGroupItem value="zoom" /> Zoom + center
        </label>
        <label className="flex items-center gap-1 text-sm">
          <RadioGroupItem value="fit" /> Fit to layer
        </label>
      </RadioGroup>

      {kind === 'zoom' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <Label className="text-xs">Zoom</Label>
            <Input type="number" min={0} max={28} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Longitude</Label>
            <Input type="number" step="any" value={lon}
              onChange={(e) => setLon(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Latitude</Label>
            <Input type="number" step="any" value={lat}
              onChange={(e) => setLat(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Duration (ms)</Label>
            <Input type="number" min={0} value={duration}
              onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-xs">Fit layer</Label>
          <Select value={fitLayer} onValueChange={setFitLayer}>
            <SelectTrigger><SelectValue placeholder="Select a layer" /></SelectTrigger>
            <SelectContent>
              {layerOptions.map((o) => <SelectItem key={o.id} value={o.id}>{optionLabel(o)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </ActionModal>
  );
};

// -----------------------------------------------------------------------------
// Active layers editor
// -----------------------------------------------------------------------------

interface ActiveLayersEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  layerOptions: string[];
  onSave: (active: string[]) => void;
}

export const ActiveLayersEditor: React.FC<ActiveLayersEditorProps> = ({
  open, onOpenChange, step, layerOptions, onSave,
}) => {
  const [active, setActive] = useState<string[]>(step.layers?.active ?? []);
  useEffect(() => { if (open) setActive(step.layers?.active ?? []); }, [open, step]);

  const toggle = (n: string) =>
    setActive((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const save = () => { onSave(active); onOpenChange(false); };
  const unknown = active.filter((n) => !layerOptions.includes(n));

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Active layers" onSave={save}>
      <div className="border rounded-md p-2 max-h-64 overflow-y-auto space-y-1">
        {layerOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">No layers configured.</p>
        )}
        {layerOptions.map((n) => (
          <label key={n} className="flex items-center gap-2 text-sm">
            <Checkbox checked={active.includes(n)} onCheckedChange={() => toggle(n)} />
            {n}
          </label>
        ))}
      </div>
      {unknown.length > 0 && (
        <div className="text-xs text-amber-600 space-y-1">
          {unknown.map((n) => (
            <div key={n} className="flex items-center gap-1">
              Unknown active layer: {n}
              <button type="button" className="underline ml-1" onClick={() => toggle(n)}>remove</button>
            </div>
          ))}
        </div>
      )}
    </ActionModal>
  );
};

// -----------------------------------------------------------------------------
// Focus layer editor
// -----------------------------------------------------------------------------

interface FocusLayerEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  layerOptions: string[];
  onSave: (focusLayer: string | undefined) => void;
}

export const FocusLayerEditor: React.FC<FocusLayerEditorProps> = ({
  open, onOpenChange, step, layerOptions, onSave,
}) => {
  const [focus, setFocus] = useState<string>(step.focusLayer ?? '__none__');
  useEffect(() => { if (open) setFocus(step.focusLayer ?? '__none__'); }, [open, step]);

  const save = () => {
    onSave(focus === '__none__' ? undefined : focus);
    onOpenChange(false);
  };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Focus layer" onSave={save}>
      <div>
        <Label className="text-xs">Focus layer</Label>
        <Select value={focus} onValueChange={setFocus}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {layerOptions.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            {step.focusLayer && !layerOptions.includes(step.focusLayer) && (
              <SelectItem value={step.focusLayer}>{step.focusLayer} (unknown)</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </ActionModal>
  );
};

// -----------------------------------------------------------------------------
// Expand panels editor
// -----------------------------------------------------------------------------

interface ExpandPanelsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  onSave: (panels: string[]) => void;
}

export const ExpandPanelsEditor: React.FC<ExpandPanelsEditorProps> = ({
  open, onOpenChange, step, onSave,
}) => {
  const [panels, setPanels] = useState<string[]>(step.expandPanels ?? []);
  const [draft, setDraft] = useState('');
  useEffect(() => { if (open) { setPanels(step.expandPanels ?? []); setDraft(''); } }, [open, step]);

  const add = () => {
    const v = draft.trim();
    if (!v || panels.includes(v)) return;
    setPanels([...panels, v]);
    setDraft('');
  };
  const remove = (v: string) => setPanels(panels.filter((p) => p !== v));

  const save = () => { onSave(panels); onOpenChange(false); };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Expand panels" onSave={save}>
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {panels.map((p) => (
          <Badge key={p} variant="secondary" className="gap-1">
            {p}
            <button type="button" onClick={() => remove(p)}><X className="h-3 w-3" /></button>
          </Badge>
        ))}
        {panels.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="panel key" className="max-w-xs" />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
    </ActionModal>
  );
};

// -----------------------------------------------------------------------------
// Layer control (opacity / blend / constraints for a single layer)
// -----------------------------------------------------------------------------

interface LayerControlEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: StoryStepControl;
  sources: DataSource[];
  onSave: (next: StoryStepControl) => void;
}

export const LayerControlEditor: React.FC<LayerControlEditorProps> = ({
  open, onOpenChange, control, sources, onSave,
}) => {
  const [working, setWorking] = useState<StoryStepControl>(control);
  useEffect(() => { if (open) setWorking(control); }, [open, control]);

  const source = findSource(sources, working.layer);
  const availableConstraints: ConstraintSourceItem[] = source?.constraints ?? [];
  const layerOptions = sources.map((s) => s.name).filter(Boolean);

  const patch = (p: Partial<StoryStepControl>) =>
    setWorking((prev) => ({ ...prev, ...p }));

  const constraints = working.constraints ?? [];
  const setConstraints = (next: StoryConstraintSelection[]) =>
    patch({ constraints: next });

  const addConstraint = () => {
    const first = availableConstraints[0];
    if (!first) {
      setConstraints([...constraints, { label: '', lower: 0, upper: 0 }]);
      return;
    }
    if (first.type === 'continuous') {
      setConstraints([...constraints, {
        label: first.label,
        lower: first.min ?? 0, upper: first.max ?? 0,
      }]);
    } else {
      setConstraints([...constraints, { label: first.label, values: [] }]);
    }
  };

  const save = () => { onSave(working); onOpenChange(false); };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Apply constraints"
      onSave={save} canSave={!!working.layer} wide>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="sm:col-span-2">
          <Label className="text-xs">Layer</Label>
          <Select value={working.layer} onValueChange={(v) => patch({ layer: v })}>
            <SelectTrigger><SelectValue placeholder="Pick a layer" /></SelectTrigger>
            <SelectContent>
              {layerOptions.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              {working.layer && !layerOptions.includes(working.layer) && (
                <SelectItem value={working.layer}>{working.layer} (unknown)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Opacity</Label>
          <Input type="number" min={0} max={1} step={0.05}
            value={working.opacity ?? ''}
            onChange={(e) => patch({
              opacity: e.target.value === '' ? undefined : Number(e.target.value),
            })} />
        </div>
        <div className="flex items-end gap-2">
          <Label className="text-xs">Blend</Label>
          <Switch checked={!!working.blend} onCheckedChange={(v) => patch({ blend: v })} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Constraints</Label>
          <Button type="button" size="sm" variant="ghost" onClick={addConstraint}
            disabled={!source}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {constraints.length === 0 && (
          <p className="text-xs text-muted-foreground">No constraints.</p>
        )}
        {constraints.map((sel, si) => (
          <ConstraintSelectionRow
            key={si}
            selection={sel}
            available={availableConstraints}
            onChange={(next) => setConstraints(constraints.map((c, i) => i === si ? next : c))}
            onRemove={() => setConstraints(constraints.filter((_, i) => i !== si))}
          />
        ))}
      </div>
    </ActionModal>
  );
};

// -----------------------------------------------------------------------------
// Constraint selection row (used inside LayerControlEditor)
// -----------------------------------------------------------------------------

interface ConstraintSelectionRowProps {
  selection: StoryConstraintSelection;
  available: ConstraintSourceItem[];
  onChange: (next: StoryConstraintSelection) => void;
  onRemove: () => void;
}

const ConstraintSelectionRow: React.FC<ConstraintSelectionRowProps> = ({
  selection, available, onChange, onRemove,
}) => {
  const def = available.find((d) => d.label === selection.label);
  const kind = def?.type ?? (selection.values ? 'categorical' : 'continuous');

  return (
    <div className="border rounded p-2 bg-background space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Label className="text-[11px]">Label</Label>
          <Select
            value={selection.label || '__pick__'}
            onValueChange={(v) => {
              const chosen = available.find((d) => d.label === v);
              if (!chosen) { onChange({ ...selection, label: v }); return; }
              if (chosen.type === 'continuous') {
                onChange({ label: chosen.label,
                  lower: chosen.min ?? 0, upper: chosen.max ?? 0 });
              } else {
                onChange({ label: chosen.label, values: [] });
              }
            }}
          >
            <SelectTrigger><SelectValue placeholder="Pick constraint" /></SelectTrigger>
            <SelectContent>
              {available.map((c) => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
              {selection.label && !available.some((a) => a.label === selection.label) && (
                <SelectItem value={selection.label}>{selection.label} (unknown)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {kind === 'continuous' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px]">Lower</Label>
            <Input type="number" value={selection.lower ?? ''}
              onChange={(e) => onChange({
                ...selection,
                lower: e.target.value === '' ? undefined : Number(e.target.value),
              })} />
          </div>
          <div>
            <Label className="text-[11px]">Upper</Label>
            <Input type="number" value={selection.upper ?? ''}
              onChange={(e) => onChange({
                ...selection,
                upper: e.target.value === '' ? undefined : Number(e.target.value),
              })} />
          </div>
        </div>
      ) : (
        <CategoricalValuesEditor def={def}
          values={selection.values ?? []}
          onChange={(next) => onChange({ ...selection, values: next })} />
      )}
    </div>
  );
};

interface CategoricalValuesEditorProps {
  def?: ConstraintSourceItem;
  values: Array<string | number>;
  onChange: (next: Array<string | number>) => void;
}

const CategoricalValuesEditor: React.FC<CategoricalValuesEditorProps> = ({
  def, values, onChange,
}) => {
  const options: Array<{ label: string; value: string | number }> = Array.isArray(def?.constrainTo)
    ? (def!.constrainTo as any[]).map((o) => ({
        label: o.label ?? String(o.value ?? ''),
        value: o.value ?? o.label,
      }))
    : [];
  const [draft, setDraft] = useState('');
  const toggle = (v: string | number) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  const addManual = () => {
    const v = draft.trim();
    if (!v) return;
    const parsed = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
    if (!values.includes(parsed)) onChange([...values, parsed]);
    setDraft('');
  };
  return (
    <div className="space-y-1">
      {options.length > 0 && (
        <div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1">
          {options.map((o) => (
            <label key={String(o.value)} className="flex items-center gap-2 text-xs">
              <Checkbox checked={values.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              {o.label} <span className="text-muted-foreground">({String(o.value)})</span>
            </label>
          ))}
        </div>
      )}
      {options.length === 0 && (
        <div className="flex gap-1">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManual(); } }}
            placeholder="value" className="h-8" />
          <Button type="button" size="sm" variant="outline" onClick={addManual}>Add</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <Badge key={String(v)} variant="secondary" className="gap-1">
            {String(v)}
            <button type="button" onClick={() => toggle(v)}><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
