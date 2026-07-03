import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, X, AlertTriangle } from 'lucide-react';
import {
  DataSource,
  StoryStep,
  StoryStepControl,
  StoryConstraintSelection,
  ConstraintSourceItem,
} from '@/types/config';
import { StoryWarning } from '@/utils/storyValidation';

interface StepEditorProps {
  step: StoryStep;
  sources: DataSource[];
  warnings?: StoryWarning[];
  onSave: (next: StoryStep) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

type WorkingStep = StoryStep;

const findSource = (sources: DataSource[], ref: string | undefined): DataSource | undefined => {
  if (!ref) return undefined;
  const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');
  return (
    sources.find((s) => s.name === ref) ??
    sources.find((s) => slug(s.name) === slug(ref))
  );
};

const isZoomViewport = (v: any): v is { zoom: number; center: [number, number]; duration?: number } =>
  v && typeof v === 'object' && 'zoom' in v;

/**
 * Full editor for a single StoryStep. Held in local state; commits on Save
 * via a single onSave dispatch (Core memory: single onSave).
 */
export const StepEditor: React.FC<StepEditorProps> = ({
  step,
  sources,
  warnings,
  onSave,
  onCancel,
  onDirtyChange,
}) => {
  const [working, setWorking] = useState<WorkingStep>(step);

  // Reset when the incoming step reference changes (core memory: init inside
  // effect on the trigger prop to prevent stale overwrites).
  useEffect(() => {
    setWorking(step);
  }, [step]);

  const dirty = JSON.stringify(working) !== JSON.stringify(step);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const patch = (p: Partial<WorkingStep>) => setWorking((prev) => ({ ...prev, ...p }));

  const layerOptions = sources.map((s) => s.name).filter(Boolean);

  const warningFor = (field: string): StoryWarning | undefined =>
    warnings?.find((w) => w.field === field);

  // ---------- Viewport ----------
  const viewportKind: 'zoom' | 'fit' = isZoomViewport(working.viewport) ? 'zoom' : 'fit';

  const setViewportKind = (kind: 'zoom' | 'fit') => {
    if (kind === 'zoom') {
      patch({
        viewport:
          isZoomViewport(working.viewport)
            ? working.viewport
            : { zoom: 6, center: [0, 0] },
      });
    } else {
      patch({
        viewport: isZoomViewport(working.viewport)
          ? { fitLayer: layerOptions[0] ?? '' }
          : working.viewport,
      });
    }
  };

  // ---------- Layers ----------
  const active = working.layers?.active ?? [];
  const toggleActive = (name: string) => {
    const next = active.includes(name)
      ? active.filter((n) => n !== name)
      : [...active, name];
    patch({ layers: { active: next } });
  };

  // ---------- Expand panels ----------
  const [panelDraft, setPanelDraft] = useState('');
  const panels = working.expandPanels ?? [];
  const addPanel = () => {
    const v = panelDraft.trim();
    if (!v || panels.includes(v)) return;
    patch({ expandPanels: [...panels, v] });
    setPanelDraft('');
  };
  const removePanel = (v: string) =>
    patch({ expandPanels: panels.filter((p) => p !== v) });

  // ---------- Controls ----------
  const controls = working.controls ?? [];
  const setControls = (next: StoryStepControl[]) => patch({ controls: next });

  const addControl = () => {
    setControls([...controls, { layer: layerOptions[0] ?? '' }]);
  };

  const updateControl = (idx: number, next: StoryStepControl) => {
    setControls(controls.map((c, i) => (i === idx ? next : c)));
  };

  const removeControl = (idx: number) => {
    setControls(controls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Basics */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Basics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Title</Label>
            <Input
              value={working.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">ID</Label>
            <Input value={working.id} onChange={(e) => patch({ id: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Description (markdown)</Label>
          <Textarea
            rows={3}
            value={working.description ?? ''}
            onChange={(e) => patch({ description: e.target.value || undefined })}
          />
        </div>
      </section>

      {/* Viewport */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Viewport</h4>
        <RadioGroup
          value={viewportKind}
          onValueChange={(v) => setViewportKind(v as 'zoom' | 'fit')}
          className="flex gap-4"
        >
          <label className="flex items-center gap-1 text-sm">
            <RadioGroupItem value="zoom" /> Zoom + center
          </label>
          <label className="flex items-center gap-1 text-sm">
            <RadioGroupItem value="fit" /> Fit to layer
          </label>
        </RadioGroup>

        {viewportKind === 'zoom' && isZoomViewport(working.viewport) && (() => {
          const zv = working.viewport;
          return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Zoom</Label>
              <Input
                type="number"
                min={0}
                max={28}
                value={zv.zoom}
                onChange={(e) =>
                  patch({ viewport: { ...zv, zoom: Number(e.target.value) } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={zv.center[0]}
                onChange={(e) =>
                  patch({
                    viewport: { ...zv, center: [Number(e.target.value), zv.center[1]] },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={zv.center[1]}
                onChange={(e) =>
                  patch({
                    viewport: { ...zv, center: [zv.center[0], Number(e.target.value)] },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Duration (ms)</Label>
              <Input
                type="number"
                min={0}
                value={zv.duration ?? ''}
                onChange={(e) =>
                  patch({
                    viewport: {
                      ...zv,
                      duration: e.target.value === '' ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
          );
        })()}

        {viewportKind === 'fit' && !isZoomViewport(working.viewport) && (
          <div>
            <Label className="text-xs">Fit layer</Label>
            <Select
              value={(working.viewport as any).fitLayer}
              onValueChange={(v) => patch({ viewport: { fitLayer: v } })}
            >
              <SelectTrigger><SelectValue placeholder="Select a layer" /></SelectTrigger>
              <SelectContent>
                {layerOptions.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      {/* Layers */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Layers</h4>
        <div>
          <Label className="text-xs">Focus layer</Label>
          <Select
            value={working.focusLayer ?? '__none__'}
            onValueChange={(v) => patch({ focusLayer: v === '__none__' ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {layerOptions.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {warningFor('focusLayer') && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {warningFor('focusLayer')!.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-xs">Active layers</Label>
          <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
            {layerOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">No layers configured.</p>
            )}
            {layerOptions.map((n) => (
              <label key={n} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={active.includes(n)}
                  onCheckedChange={() => toggleActive(n)}
                />
                {n}
              </label>
            ))}
          </div>
          {/* Unknown references still in active */}
          {active.filter((n) => !layerOptions.includes(n)).map((n) => (
            <p key={n} className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Unknown active layer: {n}
              <button
                type="button"
                className="ml-1 underline"
                onClick={() => toggleActive(n)}
              >
                remove
              </button>
            </p>
          ))}
        </div>
      </section>

      {/* Expand panels */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Expand panels</h4>
        <div className="flex flex-wrap gap-1">
          {panels.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1">
              {p}
              <button type="button" onClick={() => removePanel(p)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {panels.length === 0 && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={panelDraft}
            onChange={(e) => setPanelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPanel();
              }
            }}
            placeholder="panel key"
            className="max-w-xs"
          />
          <Button type="button" size="sm" variant="outline" onClick={addPanel}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </section>

      {/* Controls */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Per-layer controls</h4>
          <Button type="button" size="sm" variant="outline" onClick={addControl}>
            <Plus className="h-3 w-3 mr-1" /> Add control
          </Button>
        </div>
        {controls.length === 0 && (
          <p className="text-xs text-muted-foreground">No overrides.</p>
        )}
        {controls.map((c, i) => (
          <ControlEditor
            key={i}
            control={c}
            sources={sources}
            warnings={warnings?.filter((w) => w.field?.startsWith(`controls[${i}]`))}
            onChange={(next) => updateControl(i, next)}
            onRemove={() => removeControl(i)}
          />
        ))}
      </section>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!dirty} onClick={() => onSave(working)}>
          Save step
        </Button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Control editor (single per-layer control row)
// -----------------------------------------------------------------------------

interface ControlEditorProps {
  control: StoryStepControl;
  sources: DataSource[];
  warnings?: StoryWarning[];
  onChange: (next: StoryStepControl) => void;
  onRemove: () => void;
}

const ControlEditor: React.FC<ControlEditorProps> = ({
  control,
  sources,
  warnings,
  onChange,
  onRemove,
}) => {
  const source = findSource(sources, control.layer);
  const availableConstraints: ConstraintSourceItem[] = source?.constraints ?? [];
  const layerOptions = sources.map((s) => s.name).filter(Boolean);
  const layerWarning = warnings?.find((w) => w.field?.endsWith('.layer'));

  const patch = (p: Partial<StoryStepControl>) => onChange({ ...control, ...p });

  const constraints = control.constraints ?? [];
  const setConstraints = (next: StoryConstraintSelection[]) =>
    patch({ constraints: next });

  const addConstraint = () => {
    const first = availableConstraints[0];
    if (!first) {
      setConstraints([...constraints, { label: '', lower: 0, upper: 0 }]);
      return;
    }
    if (first.type === 'continuous') {
      setConstraints([
        ...constraints,
        { label: first.label, lower: first.min ?? 0, upper: first.max ?? 0 },
      ]);
    } else {
      setConstraints([...constraints, { label: first.label, values: [] }]);
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Layer</Label>
            <Select value={control.layer} onValueChange={(v) => patch({ layer: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {layerOptions.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
                {control.layer && !layerOptions.includes(control.layer) && (
                  <SelectItem value={control.layer}>{control.layer} (unknown)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Opacity</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={control.opacity ?? ''}
              onChange={(e) =>
                patch({
                  opacity: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <Label className="text-xs">Blend</Label>
            <Switch
              checked={!!control.blend}
              onCheckedChange={(v) => patch({ blend: v })}
            />
          </div>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {layerWarning && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {layerWarning.message}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Constraints</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={addConstraint}
            disabled={!source}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {constraints.map((sel, si) => {
          const def = availableConstraints.find((d) => d.label === sel.label);
          const w = warnings?.find((x) => x.field?.startsWith(`controls`) && x.field.includes(`constraints[${si}]`));
          return (
            <ConstraintSelectionEditor
              key={si}
              selection={sel}
              def={def}
              available={availableConstraints}
              warning={w}
              onChange={(next) => setConstraints(constraints.map((c, i) => (i === si ? next : c)))}
              onRemove={() => setConstraints(constraints.filter((_, i) => i !== si))}
            />
          );
        })}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Constraint selection row
// -----------------------------------------------------------------------------

interface ConstraintSelectionEditorProps {
  selection: StoryConstraintSelection;
  def?: ConstraintSourceItem;
  available: ConstraintSourceItem[];
  warning?: StoryWarning;
  onChange: (next: StoryConstraintSelection) => void;
  onRemove: () => void;
}

const ConstraintSelectionEditor: React.FC<ConstraintSelectionEditorProps> = ({
  selection,
  def,
  available,
  warning,
  onChange,
  onRemove,
}) => {
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
              if (!chosen) {
                onChange({ ...selection, label: v });
                return;
              }
              if (chosen.type === 'continuous') {
                onChange({
                  label: chosen.label,
                  lower: chosen.min ?? 0,
                  upper: chosen.max ?? 0,
                });
              } else {
                onChange({ label: chosen.label, values: [] });
              }
            }}
          >
            <SelectTrigger><SelectValue placeholder="Pick constraint" /></SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>
              ))}
              {selection.label && !available.some((a) => a.label === selection.label) && (
                <SelectItem value={selection.label}>{selection.label} (unknown)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {kind === 'continuous' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px]">Lower</Label>
            <Input
              type="number"
              value={selection.lower ?? ''}
              onChange={(e) =>
                onChange({
                  ...selection,
                  lower: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label className="text-[11px]">Upper</Label>
            <Input
              type="number"
              value={selection.upper ?? ''}
              onChange={(e) =>
                onChange({
                  ...selection,
                  upper: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      ) : (
        <CategoricalValuesEditor
          def={def}
          values={selection.values ?? []}
          onChange={(next) => onChange({ ...selection, values: next })}
        />
      )}

      {warning && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {warning.message}
        </p>
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
  def,
  values,
  onChange,
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
              <Checkbox
                checked={values.includes(o.value)}
                onCheckedChange={() => toggle(o.value)}
              />
              {o.label} <span className="text-muted-foreground">({String(o.value)})</span>
            </label>
          ))}
        </div>
      )}
      {options.length === 0 && (
        <div className="flex gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addManual();
              }
            }}
            placeholder="value"
            className="h-8"
          />
          <Button type="button" size="sm" variant="outline" onClick={addManual}>Add</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <Badge key={String(v)} variant="secondary" className="gap-1">
            {String(v)}
            <button type="button" onClick={() => toggle(v)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default StepEditor;
