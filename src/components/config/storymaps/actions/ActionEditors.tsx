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
import { Plus, X, Trash2, ChevronDown, ChevronRight, Crosshair, MoveUp, MoveDown } from 'lucide-react';
import MapCentrePickerDialog from '@/components/config/MapCentrePickerDialog';
import type {
  DataSource,
  StoryStep,
  StoryActiveLayer,
  StoryConstraintSelection,
  StoryPanelState,
  StoryPanelTabId,
  StoryViewport,
  ConstraintSourceItem,
} from '@/types/config';
import { VALID_TAB_IDS } from './types';

// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------

export interface LayerOption {
  id: string;
  name: string;
  interfaceGroup?: string;
  subinterfaceGroup?: string;
}

type ViewportMode = 'zoom' | 'fit' | 'extent';

const detectViewportMode = (v: StoryViewport | undefined): ViewportMode => {
  if (!v) return 'zoom';
  if ('zoom' in v) return 'zoom';
  if ('fitLayer' in v) return 'fit';
  if ('extent' in v) return 'extent';
  return 'zoom';
};

const findSource = (sources: DataSource[], ref: string | undefined): DataSource | undefined => {
  if (!ref) return undefined;
  const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');
  return (
    sources.find((s) => s.id === ref) ??
    sources.find((s) => s.name === ref) ??
    sources.find((s) => slug(s.name) === slug(ref))
  );
};

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
    <DialogContent className={wide ? 'sm:max-w-[820px]' : 'sm:max-w-[560px]'}>
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
// Navigation editor — zoom / fit / extent
// -----------------------------------------------------------------------------

interface NavigationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  layerOptions: LayerOption[];
  onSave: (viewport: StoryViewport) => void;
}

export const NavigationEditor: React.FC<NavigationEditorProps> = ({
  open, onOpenChange, step, layerOptions, onSave,
}) => {
  const initialMode = detectViewportMode(step.viewport);
  const [mode, setMode] = useState<ViewportMode>(initialMode);

  // Zoom fields
  const [zoom, setZoom] = useState<number>(6);
  const [lon, setLon] = useState<number>(0);
  const [lat, setLat] = useState<number>(0);
  const [duration, setDuration] = useState<string>('');

  // Fit fields
  const [fitLayer, setFitLayer] = useState<string>(layerOptions[0]?.id ?? '');

  // Extent fields
  const [minX, setMinX] = useState<string>('');
  const [minY, setMinY] = useState<string>('');
  const [maxX, setMaxX] = useState<string>('');
  const [maxY, setMaxY] = useState<string>('');
  const [projection, setProjection] = useState<string>('');
  const [maxZoom, setMaxZoom] = useState<string>('');

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const v = step.viewport;
    const m = detectViewportMode(v);
    setMode(m);
    if (v && 'zoom' in v) {
      setZoom(v.zoom); setLon(v.center[0]); setLat(v.center[1]);
      setDuration(v.duration !== undefined ? String(v.duration) : '');
    }
    if (v && 'fitLayer' in v) {
      setFitLayer(v.fitLayer || layerOptions[0]?.id || '');
      setDuration(v.duration !== undefined ? String(v.duration) : '');
    }
    if (v && 'extent' in v) {
      setMinX(String(v.extent[0])); setMinY(String(v.extent[1]));
      setMaxX(String(v.extent[2])); setMaxY(String(v.extent[3]));
      setProjection(v.projection ?? '');
      setMaxZoom(v.maxZoom !== undefined ? String(v.maxZoom) : '');
      setDuration(v.duration !== undefined ? String(v.duration) : '');
    }
  }, [open, step, layerOptions]);

  const save = () => {
    if (mode === 'zoom') {
      onSave({
        zoom, center: [lon, lat],
        ...(duration !== '' && { duration: Number(duration) }),
      });
    } else if (mode === 'fit') {
      onSave({
        fitLayer,
        ...(duration !== '' && { duration: Number(duration) }),
      });
    } else {
      onSave({
        extent: [Number(minX), Number(minY), Number(maxX), Number(maxY)],
        ...(projection && { projection }),
        ...(maxZoom !== '' && { maxZoom: Number(maxZoom) }),
        ...(duration !== '' && { duration: Number(duration) }),
      });
    }
    onOpenChange(false);
  };

  const canSaveExtent = [minX, minY, maxX, maxY].every((s) => s !== '' && !Number.isNaN(Number(s)));
  const canSave = mode === 'zoom' ? true : mode === 'fit' ? !!fitLayer : canSaveExtent;

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Navigation" onSave={save} canSave={canSave}>
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as ViewportMode)} className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-1 text-sm">
          <RadioGroupItem value="zoom" /> Zoom + center
        </label>
        <label className="flex items-center gap-1 text-sm">
          <RadioGroupItem value="fit" /> Fit to layer
        </label>
        <label className="flex items-center gap-1 text-sm">
          <RadioGroupItem value="extent" /> Fit to extent
        </label>
      </RadioGroup>

      {mode === 'zoom' && (
        <>
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
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-2">
              <Crosshair className="h-4 w-4" />
              Pick on map
            </Button>
          </div>
          <MapCentrePickerDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            center={[lon, lat]}
            zoom={zoom}
            onApply={(c, z) => { setLon(c[0]); setLat(c[1]); setZoom(z); }}
          />
        </>
      )}

      {mode === 'fit' && (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Fit layer</Label>
            <Select value={fitLayer} onValueChange={setFitLayer}>
              <SelectTrigger><SelectValue placeholder="Select a layer" /></SelectTrigger>
              <SelectContent>
                {layerOptions.map((o) => <SelectItem key={o.id} value={o.id}>{optionLabel(o)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Duration (ms)</Label>
            <Input type="number" min={0} value={duration}
              onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
      )}

      {mode === 'extent' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Min X</Label>
              <Input type="number" step="any" value={minX} onChange={(e) => setMinX(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Min Y</Label>
              <Input type="number" step="any" value={minY} onChange={(e) => setMinY(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Max X</Label>
              <Input type="number" step="any" value={maxX} onChange={(e) => setMaxX(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Max Y</Label>
              <Input type="number" step="any" value={maxY} onChange={(e) => setMaxY(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Projection</Label>
              <Input value={projection} onChange={(e) => setProjection(e.target.value)}
                placeholder="EPSG:4326" />
            </div>
            <div>
              <Label className="text-xs">Max zoom</Label>
              <Input type="number" min={0} max={28} value={maxZoom} onChange={(e) => setMaxZoom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Duration (ms)</Label>
              <Input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </ActionModal>
  );
};

// -----------------------------------------------------------------------------
// Active layers editor — manages the full StoryActiveLayer[] array
// -----------------------------------------------------------------------------

interface ActiveLayersEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  sources: DataSource[];
  layerOptions: LayerOption[];
  onSave: (active: StoryActiveLayer[]) => void;
}

export const ActiveLayersEditor: React.FC<ActiveLayersEditorProps> = ({
  open, onOpenChange, step, sources, layerOptions, onSave,
}) => {
  const [layers, setLayers] = useState<StoryActiveLayer[]>(step.activeLayers ?? []);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setLayers(step.activeLayers ?? []);
      setExpanded(new Set());
    }
  }, [open, step]);

  const patch = (i: number, p: Partial<StoryActiveLayer>) =>
    setLayers((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...p } : l)));

  const remove = (i: number) => setLayers((prev) => prev.filter((_, idx) => idx !== i));

  const move = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= layers.length) return;
    const next = [...layers];
    [next[i], next[j]] = [next[j], next[i]];
    setLayers(next);
  };

  const addLayer = (id: string) => {
    if (!id || layers.some((l) => l.id === id)) return;
    setLayers((prev) => [...prev, { id }]);
    setExpanded((prev) => new Set(prev).add(layers.length));
  };

  const toggleExpanded = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const usedIds = new Set(layers.map((l) => l.id));
  const availableToAdd = layerOptions.filter((o) => !usedIds.has(o.id));

  const save = () => { onSave(layers); onOpenChange(false); };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Active layers" onSave={save} wide>
      <div className="space-y-2">
        {layers.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No active layers yet.</p>
        )}
        {layers.map((layer, i) => {
          const source = findSource(sources, layer.id);
          const option = layerOptions.find((o) => o.id === layer.id);
          const displayName = source?.name ?? option?.name ?? layer.id;
          const isExpanded = expanded.has(i);
          const availableConstraints: ConstraintSourceItem[] = source?.constraints ?? [];
          const selectedByLabel = new Map((layer.constraints ?? []).map((c) => [c.label, c]));

          const setConstraints = (next: StoryConstraintSelection[]) =>
            patch(i, { constraints: next.length > 0 ? next : undefined });

          const toggleConstraint = (def: ConstraintSourceItem, on: boolean) => {
            const current = layer.constraints ?? [];
            if (on) {
              if (selectedByLabel.has(def.label)) return;
              const next: StoryConstraintSelection = def.type === 'continuous'
                ? { label: def.label, lower: def.min ?? 0, upper: def.max ?? 0 }
                : { label: def.label, values: [] };
              setConstraints([...current, next]);
            } else {
              setConstraints(current.filter((c) => c.label !== def.label));
            }
          };
          const updateConstraint = (label: string, next: StoryConstraintSelection) =>
            setConstraints((layer.constraints ?? []).map((c) => (c.label === label ? next : c)));

          return (
            <div key={`${layer.id}-${i}`} className="border rounded-md bg-background">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleExpanded(i)}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{displayName}</span>
                {layer.opacity !== undefined && (
                  <span className="text-[11px] text-muted-foreground">op {layer.opacity}</span>
                )}
                {layer.blend && (
                  <span className="text-[11px] text-muted-foreground">blend</span>
                )}
                {(layer.constraints?.length ?? 0) > 0 && (
                  <span className="text-[11px] text-muted-foreground">{layer.constraints!.length}c</span>
                )}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === layers.length - 1} title="Move down">
                    <MoveDown className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => remove(i)} title="Remove layer">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-3 py-2 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Opacity (0–1)</Label>
                      <Input type="number" min={0} max={1} step={0.05}
                        value={layer.opacity ?? ''}
                        onChange={(e) => patch(i, {
                          opacity: e.target.value === '' ? undefined : Number(e.target.value),
                        })} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Label className="text-xs">Blend</Label>
                      <Switch checked={!!layer.blend}
                        onCheckedChange={(v) => patch(i, { blend: v || undefined })} />
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input
                        value={layer.date === undefined ? '' : String(layer.date)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') { patch(i, { date: undefined }); return; }
                          const asNum = Number(v);
                          patch(i, { date: !Number.isNaN(asNum) && v.match(/^-?\d+(\.\d+)?$/) ? asNum : v });
                        }}
                        placeholder="earliest / latest / ISO / index" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Constraints</Label>
                    {availableConstraints.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No constraints defined for this layer.
                      </p>
                    )}
                    {availableConstraints.map((def) => {
                      const selection = selectedByLabel.get(def.label);
                      const enabled = !!selection;
                      return (
                        <div key={def.label} className="border rounded p-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox id={`c-${i}-${def.label}`}
                              checked={enabled}
                              onCheckedChange={(v) => toggleConstraint(def, v === true)} />
                            <Label htmlFor={`c-${i}-${def.label}`} className="text-sm font-normal cursor-pointer">
                              {def.label}
                              <span className="text-muted-foreground ml-1">({def.type})</span>
                            </Label>
                          </div>
                          {enabled && def.type === 'continuous' && (
                            <div className="grid grid-cols-2 gap-2 pl-6">
                              <div>
                                <Label className="text-[11px]">Lower{def.min !== undefined ? ` (min ${def.min})` : ''}</Label>
                                <Input type="number" value={selection!.lower ?? ''}
                                  onChange={(e) => updateConstraint(def.label, {
                                    ...selection!,
                                    lower: e.target.value === '' ? undefined : Number(e.target.value),
                                  })} />
                              </div>
                              <div>
                                <Label className="text-[11px]">Upper{def.max !== undefined ? ` (max ${def.max})` : ''}</Label>
                                <Input type="number" value={selection!.upper ?? ''}
                                  onChange={(e) => updateConstraint(def.label, {
                                    ...selection!,
                                    upper: e.target.value === '' ? undefined : Number(e.target.value),
                                  })} />
                              </div>
                            </div>
                          )}
                          {enabled && def.type !== 'continuous' && (
                            <div className="pl-6">
                              <CategoricalValuesEditor def={def}
                                values={selection!.values ?? []}
                                onChange={(next) => updateConstraint(def.label, {
                                  ...selection!, values: next,
                                })} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {availableToAdd.length > 0 && (
        <div className="pt-2 border-t">
          <Label className="text-xs">Add layer</Label>
          <Select value="" onValueChange={(v) => addLayer(v)}>
            <SelectTrigger><SelectValue placeholder="Pick a layer to add" /></SelectTrigger>
            <SelectContent>
              {availableToAdd.map((o) => (
                <SelectItem key={o.id} value={o.id}>{optionLabel(o)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </ActionModal>
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
    ? (def!.constrainTo as Array<{ label?: string; value?: string | number }>).map((o) => ({
        label: o.label ?? String(o.value ?? ''),
        value: o.value ?? o.label,
      }))
    : [];
  const toggle = (v: string | number) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  if (options.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        No selectable values defined for this constraint.
      </p>
    );
  }
  return (
    <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-1">
      {options.map((o) => (
        <label key={String(o.value)} className="flex items-center gap-2 text-xs">
          <Checkbox checked={values.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
          {o.label} <span className="text-muted-foreground">({String(o.value)})</span>
        </label>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Panel state editor — focus layer + controls + tab
// -----------------------------------------------------------------------------

interface PanelStateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  layerOptions: LayerOption[];
  onSave: (panelState: StoryPanelState | undefined) => void;
}

const CONTROL_KEYS = ['temporal', 'styles', 'filters'] as const;
type ControlKey = typeof CONTROL_KEYS[number];

export const PanelStateEditor: React.FC<PanelStateEditorProps> = ({
  open, onOpenChange, step, layerOptions, onSave,
}) => {
  const [focus, setFocus] = useState<string>('__none__');
  const [controls, setControls] = useState<Record<ControlKey, { expanded: boolean; disabled: boolean }>>({
    temporal: { expanded: false, disabled: false },
    styles: { expanded: false, disabled: false },
    filters: { expanded: false, disabled: false },
  });
  const [tabId, setTabId] = useState<string>('__none__');
  const [activeChart, setActiveChart] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    const ps = step.panelState;
    setFocus(ps?.focusLayer ?? '__none__');
    setControls({
      temporal: {
        expanded: !!ps?.controls?.temporal?.expanded,
        disabled: !!ps?.controls?.temporal?.disabled,
      },
      styles: {
        expanded: !!ps?.controls?.styles?.expanded,
        disabled: !!ps?.controls?.styles?.disabled,
      },
      filters: {
        expanded: !!ps?.controls?.filters?.expanded,
        disabled: !!ps?.controls?.filters?.disabled,
      },
    });
    setTabId(ps?.tab?.id ?? '__none__');
    setActiveChart(ps?.tab?.activeChart ?? '');
  }, [open, step]);

  const activeIds = new Set((step.activeLayers ?? []).map((l) => l.id));
  const focusOptions = layerOptions.filter((o) => activeIds.has(o.id));

  const save = () => {
    const nextControls: NonNullable<StoryPanelState['controls']> = {};
    for (const k of CONTROL_KEYS) {
      const c = controls[k];
      const state: { expanded?: boolean; disabled?: boolean } = {};
      if (c.expanded) state.expanded = true;
      if (c.disabled) state.disabled = true;
      if (Object.keys(state).length > 0) nextControls[k] = state;
    }
    const panel: StoryPanelState = {};
    if (focus !== '__none__') panel.focusLayer = focus;
    if (Object.keys(nextControls).length > 0) panel.controls = nextControls;
    if (tabId !== '__none__') {
      const tab: NonNullable<StoryPanelState['tab']> = { id: tabId as StoryPanelTabId };
      if (tabId === 'charts' && activeChart.trim()) tab.activeChart = activeChart.trim();
      panel.tab = tab;
    }
    onSave(Object.keys(panel).length > 0 ? panel : undefined);
    onOpenChange(false);
  };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Panel state" onSave={save} wide>
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Focus layer</Label>
          <Select value={focus} onValueChange={setFocus} disabled={focusOptions.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={focusOptions.length === 0 ? 'No active layers' : 'None'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {focusOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>{optionLabel(o)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Must also appear in this step's Active layers.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Active tab</Label>
          <RadioGroup value={tabId} onValueChange={setTabId} className="grid grid-cols-3 gap-2">
            {(['__none__', ...VALID_TAB_IDS] as const).map((t) => {
              const id = `panel-tab-${t}`;
              const label = t === '__none__' ? 'None' : t;
              return (
                <label
                  key={t}
                  htmlFor={id}
                  className="flex items-center gap-2 border rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary capitalize"
                >
                  <RadioGroupItem id={id} value={t} />
                  {label}
                </label>
              );
            })}
          </RadioGroup>
          {tabId === 'charts' && (
            <div className="pt-2">
              <Label className="text-xs">Chart title</Label>
              <Input value={activeChart} onChange={(e) => setActiveChart(e.target.value)}
                placeholder="Chart title to preselect" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Controls</Label>
          <div className="border rounded divide-y">
            {CONTROL_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-4 px-2 py-1.5">
                <span className="text-sm w-20 capitalize">{k}</span>
                <label className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={controls[k].expanded}
                    onCheckedChange={(v) =>
                      setControls((prev) => ({ ...prev, [k]: { ...prev[k], expanded: v === true } }))} />
                  Expanded
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={controls[k].disabled}
                    onCheckedChange={(v) =>
                      setControls((prev) => ({ ...prev, [k]: { ...prev[k], disabled: v === true } }))} />
                  Disabled
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ActionModal>
  );
};
