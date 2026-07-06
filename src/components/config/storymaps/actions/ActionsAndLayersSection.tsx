import React, { useState } from 'react';
import {
  Compass, Crosshair, Layers as LayersIcon, Target, SlidersHorizontal,
  PanelRightOpen, Pencil, Trash2, Plus, AlertTriangle, Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DataSource, StoryStep, StoryStepControl } from '@/types/config';
import type { StoryWarning } from '@/utils/storyValidation';
import { cn } from '@/lib/utils';
import {
  ACTION_META, CATEGORY_ORDER, hasKind, warningsForAction,
  type ActionKind, type ActionCategory,
} from './types';
import {
  NavigationEditor, ActiveLayersEditor, FocusLayerEditor,
  ExpandPanelsEditor, LayerControlEditor,
} from './ActionEditors';

// -----------------------------------------------------------------------------
// Pill helper (matches layer card outline badge treatment)
// -----------------------------------------------------------------------------

const Pill: React.FC<{
  tint?: 'neutral' | 'info' | 'amber';
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ tint = 'neutral', icon, children }) => {
  const tintCls =
    tint === 'info' ? 'border-blue-300 text-blue-700'
    : tint === 'amber' ? 'border-amber-300 text-amber-700'
    : 'border-border text-foreground/70';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] leading-none',
      tintCls,
    )}>
      {icon}{children}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Icons per action kind
// -----------------------------------------------------------------------------

const ACTION_ICON: Record<ActionKind, React.ReactNode> = {
  navigation: <Compass className="h-4 w-4" />,
  activeLayers: <LayersIcon className="h-4 w-4" />,
  focusLayer: <Target className="h-4 w-4" />,
  layerControl: <SlidersHorizontal className="h-4 w-4" />,
  expandPanels: <PanelRightOpen className="h-4 w-4" />,
};

// -----------------------------------------------------------------------------
// ActionCard — compact summary row for a single action instance
// -----------------------------------------------------------------------------

interface ActionCardProps {
  kind: ActionKind;
  title: string;
  summary: React.ReactNode;
  pills?: React.ReactNode;
  warnings?: StoryWarning[];
  onEdit: () => void;
  onRemove: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  kind, title, summary, pills, warnings, onEdit, onRemove,
}) => {
  const hasWarn = (warnings?.length ?? 0) > 0;
  return (
    <div className="border rounded-md bg-background px-3 py-2">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground mt-0.5">{ACTION_ICON[kind]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {title}
            </span>
            {pills}
            {hasWarn && (
              <TooltipProvider>
                <Tooltip delayDuration={400}>
                  <TooltipTrigger asChild>
                    <span>
                      <Pill tint="amber" icon={<AlertTriangle className="h-3 w-3" />}>
                        {warnings!.length}
                      </Pill>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <ul className="text-xs space-y-1">
                      {warnings!.map((w, i) => <li key={i}>{w.message}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {summary && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {summary}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit} title="Edit action">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10"
            onClick={onRemove} title="Remove action">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Add action menu
// -----------------------------------------------------------------------------

interface AddActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: StoryStep;
  onPick: (kind: ActionKind) => void;
}

const AddActionMenu: React.FC<AddActionMenuProps> = ({ open, onOpenChange, step, onPick }) => {
  const byCategory: Record<ActionCategory, ActionKind[]> = {
    'Navigation': ['navigation'],
    'Layer display': ['activeLayers', 'focusLayer'],
    'Apply constraints': ['layerControl'],
    'UI': ['expandPanels'],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add action</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="space-y-1">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {cat}
              </h5>
              <div className="space-y-1">
                {byCategory[cat].map((kind) => {
                  const meta = ACTION_META[kind];
                  const disabled = meta.singleton && hasKind(step, kind);
                  return (
                    <button
                      key={kind}
                      type="button"
                      disabled={disabled}
                      onClick={() => { onPick(kind); onOpenChange(false); }}
                      className={cn(
                        'w-full text-left border rounded-md px-3 py-2 flex items-start gap-3 transition-colors',
                        disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-muted/60 hover:border-primary/30',
                      )}
                    >
                      <span className="text-muted-foreground mt-0.5">{ACTION_ICON[kind]}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium">{meta.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {meta.description}
                          {disabled && ' — already added'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// -----------------------------------------------------------------------------
// ActionsAndLayersSection — orchestrator
// -----------------------------------------------------------------------------

interface Props {
  step: StoryStep;
  sources: DataSource[];
  warnings?: StoryWarning[];
  onChange: (next: StoryStep) => void;
  /** Optional custom header renderer. Receives count and add-action callback. */
  renderHeader?: (args: { count: number; onAdd: () => void }) => React.ReactNode;
  /** Skip the built-in section border-top when the header is combined elsewhere. */
  bare?: boolean;
  /** Restrict which action kinds this section manages. Defaults to all kinds. */
  allowedKinds?: ActionKind[];
  /** Header title (default: "Actions & Layers"). */
  title?: string;
  /** Header icon (default: Film). */
  headerIcon?: React.ReactNode;
  /** Add-button label (default: "Add action"). */
  addLabel?: string;
}

type OpenEditor =
  | { kind: 'navigation' }
  | { kind: 'activeLayers' }
  | { kind: 'focusLayer' }
  | { kind: 'expandPanels' }
  | { kind: 'layerControl'; index: number }
  | null;

export const ActionsAndLayersSection: React.FC<Props> = ({
  step, sources, warnings, onChange, renderHeader, bare,
  allowedKinds, title = 'Actions & Layers', headerIcon, addLabel = 'Add action',
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openEditor, setOpenEditor] = useState<OpenEditor>(null);
  const isAllowed = (k: ActionKind) => !allowedKinds || allowedKinds.includes(k);


  const layerOptions = sources
    .map((s) => ({ id: s.id, name: s.name }))
    .filter((o) => !!o.id);
  const patch = (p: Partial<StoryStep>) => onChange({ ...step, ...p });

  const handlePick = (kind: ActionKind) => {
    if (kind === 'layerControl') {
      // Append a new empty control and open its editor
      const next = [...(step.controls ?? []), { layer: layerOptions[0]?.id ?? '' }];
      onChange({ ...step, controls: next });
      setOpenEditor({ kind: 'layerControl', index: next.length - 1 });
    } else {
      setOpenEditor({ kind });
    }
  };

  const removeAction = (kind: ActionKind, index?: number) => {
    switch (kind) {
      case 'navigation':
        // Reset to a default zoom viewport (viewport is required in schema)
        patch({ viewport: { zoom: 6, center: [0, 0] } });
        break;
      case 'activeLayers':
        patch({ layers: { active: [] } });
        break;
      case 'focusLayer':
        patch({ focusLayer: undefined });
        break;
      case 'expandPanels':
        patch({ expandPanels: [] });
        break;
      case 'layerControl':
        if (index === undefined) return;
        patch({ controls: (step.controls ?? []).filter((_, i) => i !== index) });
        break;
    }
  };

  // --------------------------------------------------------------------------
  // Build the ordered list of action cards for the current step
  // --------------------------------------------------------------------------

  type Item = {
    key: string;
    kind: ActionKind;
    title: string;
    summary: React.ReactNode;
    pills?: React.ReactNode;
    warnings?: StoryWarning[];
    onEdit: () => void;
    onRemove: () => void;
  };
  const items: Item[] = [];

  // Navigation (always present because viewport is required)
  if (step.viewport && isAllowed('navigation')) {
    const v = step.viewport;
    const isZoom = 'zoom' in v;
    items.push({
      key: 'navigation',
      kind: 'navigation',
      title: 'Navigation',
      summary: isZoom
        ? <>Zoom {v.zoom} · [{v.center[0]}, {v.center[1]}]</>
        : <>Fit → {(v as any).fitLayer || <em>none</em>}</>,
      pills: (
        <>
          {isZoom ? (
            <Pill tint="info" icon={<Compass className="h-3 w-3" />}>Zoom &amp; center</Pill>
          ) : (
            <Pill tint="info" icon={<Crosshair className="h-3 w-3" />}>Fit to layer</Pill>
          )}
          {isZoom && v.duration !== undefined && <Pill>{v.duration}ms</Pill>}
        </>
      ),
      onEdit: () => setOpenEditor({ kind: 'navigation' }),
      onRemove: () => removeAction('navigation'),
    });
  }

  // Active layers
  if (hasKind(step, 'activeLayers') && isAllowed('activeLayers')) {
    const active = step.layers?.active ?? [];
    items.push({
      key: 'activeLayers',
      kind: 'activeLayers',
      title: 'Active layers',
      summary: active.slice(0, 4).join(' · ') + (active.length > 4 ? ` · +${active.length - 4}` : ''),
      pills: <Pill icon={<LayersIcon className="h-3 w-3" />}>{active.length} layer{active.length === 1 ? '' : 's'}</Pill>,
      warnings: warningsForAction(warnings, 'activeLayers'),
      onEdit: () => setOpenEditor({ kind: 'activeLayers' }),
      onRemove: () => removeAction('activeLayers'),
    });
  }

  // Focus layer
  if (hasKind(step, 'focusLayer') && isAllowed('focusLayer')) {
    items.push({
      key: 'focusLayer',
      kind: 'focusLayer',
      title: 'Focus layer',
      summary: step.focusLayer,
      warnings: warningsForAction(warnings, 'focusLayer'),
      onEdit: () => setOpenEditor({ kind: 'focusLayer' }),
      onRemove: () => removeAction('focusLayer'),
    });
  }

  // Layer controls (one card per entry)
  (step.controls ?? []).forEach((c, i) => {
    const nConstraints = c.constraints?.length ?? 0;
    const bits: string[] = [];
    if (c.opacity !== undefined) bits.push(`opacity ${c.opacity}`);
    if (c.blend) bits.push('blend');
    if (nConstraints > 0) bits.push(`${nConstraints} constraint${nConstraints === 1 ? '' : 's'}`);
    items.push({
      key: `layerControl-${i}`,
      kind: 'layerControl',
      title: 'Apply constraints',
      summary: <>{c.layer || <em>no layer</em>}{bits.length > 0 ? ` · ${bits.join(' · ')}` : ''}</>,
      warnings: warningsForAction(warnings, 'layerControl', i),
      onEdit: () => setOpenEditor({ kind: 'layerControl', index: i }),
      onRemove: () => removeAction('layerControl', i),
    });
  });

  // Expand panels
  if (hasKind(step, 'expandPanels')) {
    const panels = step.expandPanels ?? [];
    items.push({
      key: 'expandPanels',
      kind: 'expandPanels',
      title: 'Expand panels',
      summary: panels.join(' · '),
      pills: <Pill>{panels.length}</Pill>,
      onEdit: () => setOpenEditor({ kind: 'expandPanels' }),
      onRemove: () => removeAction('expandPanels'),
    });
  }

  const editingControl =
    openEditor?.kind === 'layerControl'
      ? (step.controls ?? [])[openEditor.index]
      : undefined;

  return (
    <section className={cn('space-y-2', !bare && 'border-t pt-3')}>
      {renderHeader ? (
        renderHeader({ count: items.length, onAdd: () => setPickerOpen(true) })
      ) : (
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Actions &amp; Layers
          </h4>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">({items.length})</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" /> Add action
          </Button>
        </div>
      )}

      <div className={cn('space-y-2', !bare && 'ml-6')}>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No actions yet. Use “Add action” to define what this step does.
          </p>
        )}
        {items.map((item) => (
          <ActionCard
            key={item.key}
            kind={item.kind}
            title={item.title}
            summary={item.summary}
            pills={item.pills}
            warnings={item.warnings}
            onEdit={item.onEdit}
            onRemove={item.onRemove}
          />
        ))}
      </div>

      <AddActionMenu
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        step={step}
        onPick={handlePick}
      />

      <NavigationEditor
        open={openEditor?.kind === 'navigation'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        layerOptions={layerOptions}
        onSave={(viewport) => patch({ viewport })}
      />
      <ActiveLayersEditor
        open={openEditor?.kind === 'activeLayers'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        layerOptions={layerOptions}
        onSave={(active) => patch({ layers: { active } })}
      />
      <FocusLayerEditor
        open={openEditor?.kind === 'focusLayer'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        layerOptions={layerOptions}
        onSave={(focusLayer) => patch({ focusLayer })}
      />
      <ExpandPanelsEditor
        open={openEditor?.kind === 'expandPanels'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        onSave={(panels) => patch({ expandPanels: panels })}
      />
      {editingControl && openEditor?.kind === 'layerControl' && (
        <LayerControlEditor
          open={true}
          onOpenChange={(o) => !o && setOpenEditor(null)}
          control={editingControl}
          sources={sources}
          onSave={(next) => {
            const idx = openEditor.index;
            patch({
              controls: (step.controls ?? []).map((c, i) => i === idx ? next : c),
            });
          }}
        />
      )}
    </section>
  );
};

export default ActionsAndLayersSection;
