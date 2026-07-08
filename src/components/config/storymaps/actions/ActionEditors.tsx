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
import { Plus, X, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
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
  interfaceGroup?: string;
  subinterfaceGroup?: string;
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
        </>
      ) : (
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
  layerOptions: LayerOption[];
  onSave: (active: string[]) => void;
}

export const ActiveLayersEditor: React.FC<ActiveLayersEditorProps> = ({
  open, onOpenChange, step, layerOptions, onSave,
}) => {
  const [active, setActive] = useState<string[]>(step.layers?.active ?? []);
  useEffect(() => { if (open) setActive(step.layers?.active ?? []); }, [open, step]);

  const toggle = (id: string) =>
    setActive((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const isChecked = (o: LayerOption) => active.includes(o.id) || active.includes(o.name);

  const save = () => { onSave(active); onOpenChange(false); };
  const knownIds = new Set(layerOptions.map((o) => o.id));
  const knownNames = new Set(layerOptions.map((o) => o.name));
  const unknown = active.filter((ref) => !knownIds.has(ref) && !knownNames.has(ref));

  // Build tree: interfaceGroup -> subinterfaceGroup -> layers.
  // Preserve source order. Empty group labels are grouped under "Ungrouped".
  const UNGROUPED = '__ungrouped__';
  const tree = React.useMemo(() => {
    const groups: Array<{
      key: string;
      label: string;
      subs: Array<{ key: string; label: string; layers: LayerOption[] }>;
    }> = [];
    const groupIdx = new Map<string, number>();
    const subIdx = new Map<string, number>();

    for (const o of layerOptions) {
      const gLabel = o.interfaceGroup?.trim() || '';
      const sLabel = o.subinterfaceGroup?.trim() || '';
      const gKey = gLabel || UNGROUPED;
      if (!groupIdx.has(gKey)) {
        groupIdx.set(gKey, groups.length);
        groups.push({ key: gKey, label: gLabel || 'Ungrouped', subs: [] });
      }
      const g = groups[groupIdx.get(gKey)!];
      const sKey = `${gKey}::${sLabel || UNGROUPED}`;
      if (!subIdx.has(sKey)) {
        subIdx.set(sKey, g.subs.length);
        g.subs.push({ key: sKey, label: sLabel, layers: [] });
      }
      g.subs[subIdx.get(sKey)!].layers.push(o);
    }
    return groups;
  }, [layerOptions]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapsed = (key: string) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Group-level toggle: if all checked -> uncheck all, else check all
  const setGroupChecked = (layers: LayerOption[], checked: boolean) => {
    setActive((prev) => {
      const set = new Set(prev);
      for (const o of layers) {
        // Remove both id and name aliases to avoid duplicates
        set.delete(o.id);
        set.delete(o.name);
        if (checked) set.add(o.id);
      }
      return Array.from(set);
    });
  };

  const groupState = (layers: LayerOption[]): 'all' | 'some' | 'none' => {
    const checked = layers.filter(isChecked).length;
    if (checked === 0) return 'none';
    if (checked === layers.length) return 'all';
    return 'some';
  };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Active layers" onSave={save}>
      <div className="border rounded-md p-2 max-h-80 overflow-y-auto">
        {layerOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">No layers configured.</p>
        )}
        {tree.map((group) => {
          const groupLayers = group.subs.flatMap((s) => s.layers);
          const gState = groupState(groupLayers);
          const gCollapsed = collapsed.has(group.key);
          return (
            <div key={group.key} className="mb-1">
              <div className="flex items-center gap-1 py-1 rounded hover:bg-muted/50">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(group.key)}
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={gCollapsed ? 'Expand group' : 'Collapse group'}
                >
                  {gCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <Checkbox
                  checked={gState === 'all' ? true : gState === 'some' ? 'indeterminate' : false}
                  onCheckedChange={(v) => setGroupChecked(groupLayers, v === true)}
                />
                <span className="text-sm font-medium">{group.label}</span>
                <span className="text-[11px] text-muted-foreground ml-1">
                  ({groupLayers.filter(isChecked).length}/{groupLayers.length})
                </span>
              </div>
              {!gCollapsed && (
                <div className="ml-5 border-l pl-2">
                  {group.subs.map((sub) => {
                    const showSub = !!sub.label;
                    const sState = groupState(sub.layers);
                    const sCollapsed = collapsed.has(sub.key);
                    return (
                      <div key={sub.key} className="mt-0.5">
                        {showSub && (
                          <div className="flex items-center gap-1 py-1 rounded hover:bg-muted/50">
                            <button
                              type="button"
                              onClick={() => toggleCollapsed(sub.key)}
                              className="p-0.5 text-muted-foreground hover:text-foreground"
                              aria-label={sCollapsed ? 'Expand sub-group' : 'Collapse sub-group'}
                            >
                              {sCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                            <Checkbox
                              checked={sState === 'all' ? true : sState === 'some' ? 'indeterminate' : false}
                              onCheckedChange={(v) => setGroupChecked(sub.layers, v === true)}
                            />
                            <span className="text-sm">{sub.label}</span>
                            <span className="text-[11px] text-muted-foreground ml-1">
                              ({sub.layers.filter(isChecked).length}/{sub.layers.length})
                            </span>
                          </div>
                        )}
                        {(!showSub || !sCollapsed) && (
                          <div className={showSub ? 'ml-5 border-l pl-2' : ''}>
                            {sub.layers.map((o) => (
                              <label
                                key={o.id}
                                className="flex items-center gap-2 text-sm py-0.5 pl-1 rounded hover:bg-muted/50 cursor-pointer"
                              >
                                <Checkbox
                                  checked={isChecked(o)}
                                  onCheckedChange={() => toggle(o.id)}
                                />
                                {optionLabel(o)}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
  layerOptions: LayerOption[];
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

  // Restrict choices to layers currently in this step's active list.
  const activeRefs = step.layers?.active ?? [];
  const activeSet = new Set(activeRefs);
  const activeOptions = layerOptions.filter(
    (o) => activeSet.has(o.id) || activeSet.has(o.name),
  );
  const knownRefs = new Set<string>([
    ...activeOptions.map((o) => o.id),
    ...activeOptions.map((o) => o.name),
  ]);

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Focus layer" onSave={save}>
      <div>
        <Label className="text-xs">Focus layer</Label>
        <Select value={focus} onValueChange={setFocus} disabled={activeOptions.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder={activeOptions.length === 0 ? 'No active layers' : 'None'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {activeOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>{optionLabel(o)}</SelectItem>
            ))}
            {step.focusLayer && !knownRefs.has(step.focusLayer) && (
              <SelectItem value={step.focusLayer}>{step.focusLayer} (not in active layers)</SelectItem>
            )}
          </SelectContent>
        </Select>
        {activeOptions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground mt-1">
            Add layers to this step's Active layers first, then pick one to focus.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">
            Choose from the layers activated in this step.
          </p>
        )}
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
  useEffect(() => { if (open) setPanels(step.expandPanels ?? []); }, [open, step]);

  const AVAILABLE_PANELS: { key: string; label: string }[] = [
    { key: 'filters', label: 'Filters' },
    { key: 'styles', label: 'Styles' },
    { key: 'temporal', label: 'Temporal' },
  ];

  const toggle = (key: string, checked: boolean) => {
    setPanels((prev) =>
      checked ? (prev.includes(key) ? prev : [...prev, key]) : prev.filter((p) => p !== key),
    );
  };

  const save = () => { onSave(panels); onOpenChange(false); };

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Expand panels" onSave={save}>
      <div className="space-y-2">
        {AVAILABLE_PANELS.map(({ key, label }) => {
          const id = `expand-panel-${key}`;
          return (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={panels.includes(key)}
                onCheckedChange={(v) => toggle(key, v === true)}
              />
              <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
                {label} <span className="text-muted-foreground">({key})</span>
              </Label>
            </div>
          );
        })}
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
  /** Index of the control being edited within step.controls (for sibling-exclusion). */
  controlIndex: number;
  step: StoryStep;
  sources: DataSource[];
  onSave: (next: StoryStepControl) => void;
}

export const LayerControlEditor: React.FC<LayerControlEditorProps> = ({
  open, onOpenChange, control, controlIndex, step, sources, onSave,
}) => {
  const [working, setWorking] = useState<StoryStepControl>(control);
  useEffect(() => { if (open) setWorking(control); }, [open, control]);

  const activeIds: string[] = step.layers?.active ?? [];
  const siblingLayerIds = new Set(
    (step.controls ?? [])
      .map((c, i) => (i !== controlIndex ? c.layer : ''))
      .filter(Boolean),
  );

  // Build the layer options list, restricted to active layers of the step.
  const activeLayerOptions = activeIds
    .map((ref) => {
      const src = findSource(sources, ref);
      return {
        id: ref,
        name: src?.name ?? ref,
        alreadyUsed: siblingLayerIds.has(ref),
      };
    });

  const source = findSource(sources, working.layer);
  const availableConstraints: ConstraintSourceItem[] = source?.constraints ?? [];

  const patch = (p: Partial<StoryStepControl>) =>
    setWorking((prev) => ({ ...prev, ...p }));

  const constraints = working.constraints ?? [];
  const setConstraints = (next: StoryConstraintSelection[]) =>
    patch({ constraints: next });

  const selectedByLabel = new Map(constraints.map((c) => [c.label, c]));

  const toggleConstraint = (def: ConstraintSourceItem, on: boolean) => {
    if (on) {
      if (selectedByLabel.has(def.label)) return;
      const isContinuous = def.type === 'continuous';
      const next: StoryConstraintSelection = isContinuous
        ? { label: def.label, lower: def.min ?? 0, upper: def.max ?? 0 }
        : { label: def.label, values: [] };
      setConstraints([...constraints, next]);
    } else {
      setConstraints(constraints.filter((c) => c.label !== def.label));
    }
  };

  const updateConstraint = (label: string, next: StoryConstraintSelection) =>
    setConstraints(constraints.map((c) => (c.label === label ? next : c)));

  // When the layer changes, drop any selections whose labels no longer exist.
  useEffect(() => {
    if (!source) return;
    const validLabels = new Set(availableConstraints.map((c) => c.label));
    const filtered = constraints.filter((c) => validLabels.has(c.label));
    if (filtered.length !== constraints.length) {
      setConstraints(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [working.layer]);

  const save = () => { onSave(working); onOpenChange(false); };

  const noActiveLayers = activeLayerOptions.length === 0;

  return (
    <ActionModal open={open} onOpenChange={onOpenChange} title="Apply constraints"
      onSave={save} canSave={!!working.layer && !noActiveLayers} wide>
      {noActiveLayers ? (
        <p className="text-xs text-muted-foreground">
          Add active layers to this step first — constraints can only be applied to an active layer.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Layer</Label>
              <Select value={working.layer || undefined} onValueChange={(v) => patch({ layer: v })}>
                <SelectTrigger><SelectValue placeholder="Pick an active layer" /></SelectTrigger>
                <SelectContent>
                  {activeLayerOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id} disabled={o.alreadyUsed}>
                      {o.name}{o.alreadyUsed ? ' (already configured)' : ''}
                    </SelectItem>
                  ))}
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
            <Label className="text-xs">Constraints</Label>
            {!working.layer && (
              <p className="text-xs text-muted-foreground">Pick a layer to see its constraints.</p>
            )}
            {working.layer && availableConstraints.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No constraints defined for this layer.
              </p>
            )}
            {working.layer && availableConstraints.map((def) => {
              const selection = selectedByLabel.get(def.label);
              const enabled = !!selection;
              return (
                <div key={def.label} className="border rounded p-2 bg-background space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`constraint-${def.label}`}
                      checked={enabled}
                      onCheckedChange={(v) => toggleConstraint(def, v === true)}
                    />
                    <Label htmlFor={`constraint-${def.label}`} className="text-sm font-normal cursor-pointer">
                      {def.label}
                      <span className="text-muted-foreground ml-1">({def.type})</span>
                    </Label>
                  </div>

                  {enabled && def.type === 'continuous' && (
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <div>
                        <Label className="text-[11px]">
                          Lower{def.min !== undefined ? ` (min ${def.min})` : ''}
                        </Label>
                        <Input type="number" value={selection!.lower ?? ''}
                          onChange={(e) => updateConstraint(def.label, {
                            ...selection!,
                            lower: e.target.value === '' ? undefined : Number(e.target.value),
                          })} />
                      </div>
                      <div>
                        <Label className="text-[11px]">
                          Upper{def.max !== undefined ? ` (max ${def.max})` : ''}
                        </Label>
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
        </>
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
    ? (def!.constrainTo as any[]).map((o) => ({
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
