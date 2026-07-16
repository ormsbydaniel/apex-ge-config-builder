import React, { useState } from 'react';
import {
  Compass, Layers as LayersIcon, PanelRightOpen, Pencil, Trash2, Plus,
  AlertTriangle, Film, Map as MapIcon, SlidersHorizontal, ChevronsRight,
} from 'lucide-react';
import type { CopyFacet } from '../copySteps';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DataSource, StoryStep, StoryActiveLayer, StoryPanelState, StoryViewport } from '@/types/config';
import type { StoryWarning } from '@/utils/storyValidation';
import { cn } from '@/lib/utils';
import {
  ACTION_META, CATEGORY_ORDER, hasKind, warningsForAction,
  type ActionKind, type ActionCategory,
} from './types';
import { NavigationEditor, ActiveLayersEditor, PanelStateEditor, BaseLayerEditor, ConstraintsEditor } from './ActionEditors';

// -----------------------------------------------------------------------------
// Pill helper
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
  baseLayer: <MapIcon className="h-4 w-4" />,
  constraints: <SlidersHorizontal className="h-4 w-4" />,
  panelState: <PanelRightOpen className="h-4 w-4" />,
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
  onRemove?: () => void;
  onCopy?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  kind, title, summary, pills, warnings, onEdit, onRemove, onCopy,
}) => {
  const hasWarn = (warnings?.length ?? 0) > 0;
  return (
    <div className="px-1 py-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-muted-foreground flex-shrink-0">{ACTION_ICON[kind]}</span>
        <span className="text-xs font-semibold text-foreground flex-shrink-0">{title}</span>
        {summary && (
          <span className="text-xs text-muted-foreground truncate min-w-0">
            {summary}
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
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
          {onCopy && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy} title="Copy to other steps">
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit} title="Edit action">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10"
              onClick={onRemove} title="Remove action">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
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
  allowedKinds?: ActionKind[];
}

const AddActionMenu: React.FC<AddActionMenuProps> = ({ open, onOpenChange, step, onPick, allowedKinds }) => {
  const filter = (kinds: ActionKind[]) =>
    allowedKinds ? kinds.filter((k) => allowedKinds.includes(k)) : kinds;
  const byCategory: Record<ActionCategory, ActionKind[]> = {
    'Navigation': filter(['navigation']),
    'Layer display': filter(['baseLayer', 'activeLayers', 'constraints']),
    'Panels': filter(['panelState']),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add / edit action</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
          {CATEGORY_ORDER.filter((cat) => byCategory[cat].length > 0).map((cat) => (
            <div key={cat} className="space-y-1">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h5>
              <div className="space-y-1">
                {byCategory[cat].map((kind) => {
                  const meta = ACTION_META[kind];
                  const alreadyAdded = meta.singleton && hasKind(step, kind);
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => { onPick(kind); onOpenChange(false); }}
                      className={cn(
                        'w-full text-left border rounded-md px-3 py-2 flex items-start gap-3 transition-colors',
                        'hover:bg-muted/60 hover:border-primary/30',
                      )}
                    >
                      <span className="text-muted-foreground mt-0.5">{ACTION_ICON[kind]}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium">{meta.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {meta.description}{alreadyAdded && ' — edit current settings'}
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
  renderHeader?: (args: { count: number; onAdd: () => void }) => React.ReactNode;
  bare?: boolean;
  allowedKinds?: ActionKind[];
  title?: string;
  headerIcon?: React.ReactNode;
  addLabel?: string;
  /** Open the "copy this facet to other steps" modal. */
  onCopyAction?: (facet: CopyFacet) => void;
}

type OpenEditor =
  | { kind: 'navigation' }
  | { kind: 'activeLayers' }
  | { kind: 'baseLayer' }
  | { kind: 'constraints' }
  | { kind: 'panelState' }
  | null;

export const ActionsAndLayersSection: React.FC<Props> = ({
  step, sources, warnings, onChange, renderHeader, bare,
  allowedKinds, title = 'Actions & Layers', headerIcon, addLabel = 'Add action',
  onCopyAction,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openEditor, setOpenEditor] = useState<OpenEditor>(null);
  const isAllowed = (k: ActionKind) => !allowedKinds || allowedKinds.includes(k);

  // Overlay (non-base) layer options are used for Active layers, Navigation
  // "fit to layer" and Panel focus. Base map picker uses raw `sources`.
  const layerOptions = sources
    .filter((s) => !s.isBaseLayer)
    .map((s) => ({
      id: s.id,
      name: s.name,
      interfaceGroup: s.layout?.interfaceGroup,
      subinterfaceGroup: s.layout?.subinterfaceGroup,
    }))
    .filter((o) => !!o.id);
  const patch = (p: Partial<StoryStep>) => onChange({ ...step, ...p });

  const handlePick = (kind: ActionKind) => setOpenEditor({ kind } as OpenEditor);

  const removeAction = (kind: ActionKind) => {
    switch (kind) {
      case 'navigation':
        patch({ viewport: { zoom: 2, center: [0, 0] } });
        break;
      case 'activeLayers':
        patch({ activeLayers: [] });
        break;
      case 'baseLayer':
        patch({ baseLayer: undefined });
        break;
      case 'constraints':
        patch({
          activeLayers: (step.activeLayers ?? []).map((l) => {
            const { constraints: _c, ...rest } = l;
            return rest;
          }),
        });
        break;
      case 'panelState':
        patch({ panelState: undefined });
        break;
    }
  };

  type Item = {
    key: string;
    kind: ActionKind;
    title: string;
    summary: React.ReactNode;
    pills?: React.ReactNode;
    warnings?: StoryWarning[];
    onEdit: () => void;
    onRemove?: () => void;
    onCopy?: () => void;
  };
  const copyHandler = (facet: CopyFacet) =>
    onCopyAction ? () => onCopyAction(facet) : undefined;
  const items: Item[] = [];

  // Navigation (viewport is required, so no remove — resets to default zoom).
  if (step.viewport && isAllowed('navigation')) {
    const v = step.viewport;
    let mode: 'Zoom to' | 'Fit layer' | 'Fit extent';
    let summary: React.ReactNode;
    if ('zoom' in v) {
      mode = 'Zoom to';
      summary = <>Zoom {v.zoom} · [{v.center[0].toFixed(2)}, {v.center[1].toFixed(2)}]</>;
    } else if ('fitLayer' in v) {
      mode = 'Fit layer';
      summary = <>{v.fitLayer || <em>none</em>}</>;
    } else {
      mode = 'Fit extent';
      summary = <>[{v.extent.map((n) => n.toFixed(2)).join(', ')}]</>;
    }
    items.push({
      key: 'navigation',
      kind: 'navigation',
      title: mode,
      summary,
      pills: v.duration !== undefined ? <Pill>{v.duration}ms</Pill> : undefined,
      onEdit: () => setOpenEditor({ kind: 'navigation' }),
      onCopy: copyHandler('navigation'),
    });
  }

  // Base map
  if (hasKind(step, 'baseLayer') && isAllowed('baseLayer')) {
    const bl = step.baseLayer!;
    const src = sources.find((s) => s.id === bl);
    const name = src?.name ?? bl;
    items.push({
      key: 'baseLayer',
      kind: 'baseLayer',
      title: 'Base map',
      summary: src ? name : <><em>{bl}</em> (unknown)</>,
      warnings: warningsForAction(warnings, 'baseLayer'),
      onEdit: () => setOpenEditor({ kind: 'baseLayer' }),
      onRemove: () => removeAction('baseLayer'),
      onCopy: copyHandler('baseLayer'),
    });
  }

  // Active layers
  if (hasKind(step, 'activeLayers') && isAllowed('activeLayers')) {
    const active = step.activeLayers ?? [];
    items.push({
      key: 'activeLayers',
      kind: 'activeLayers',
      title: 'Active layers',
      summary: active.slice(0, 4).map((l) => l.id).join(' · ') + (active.length > 4 ? ` · +${active.length - 4}` : ''),
      pills: <Pill icon={<LayersIcon className="h-3 w-3" />}>{active.length} layer{active.length === 1 ? '' : 's'}</Pill>,
      warnings: warningsForAction(warnings, 'activeLayers'),
      onEdit: () => setOpenEditor({ kind: 'activeLayers' }),
      onRemove: () => removeAction('activeLayers'),
      onCopy: copyHandler('activeLayers'),
    });
  }

  // Constraints (aggregated view over activeLayers[*].constraints)
  if (hasKind(step, 'constraints') && isAllowed('constraints')) {
    const active = step.activeLayers ?? [];
    const chunks = active
      .filter((l) => (l.constraints?.length ?? 0) > 0)
      .map((l) => {
        const labels = (l.constraints ?? []).map((c) => c.label || 'unnamed').join(', ');
        return `${l.id}: ${labels}`;
      });
    const total = active.reduce((n, l) => n + (l.constraints?.length ?? 0), 0);
    const shown = chunks.slice(0, 4).join(' · ');
    const summary = chunks.length > 4 ? `${shown} · +${chunks.length - 4} more` : shown;
    items.push({
      key: 'constraints',
      kind: 'constraints',
      title: 'Constraints',
      summary,
      pills: <Pill icon={<SlidersHorizontal className="h-3 w-3" />}>{total} constraint{total === 1 ? '' : 's'}</Pill>,
      warnings: warningsForAction(warnings, 'constraints'),
      onEdit: () => setOpenEditor({ kind: 'constraints' }),
      onRemove: () => removeAction('constraints'),
    });
  }




  // Panel state
  if (hasKind(step, 'panelState') && isAllowed('panelState')) {
    const ps = step.panelState!;
    const bits: string[] = [];
    if (ps.focusLayer) bits.push(`focus: ${ps.focusLayer}`);
    if (ps.tab) bits.push(`tab: ${ps.tab.id}`);
    const cControls = Object.entries(ps.controls ?? {}).map(([k, v]) => {
      const flags: string[] = [];
      if (v?.expanded) flags.push('exp');
      if (v?.disabled) flags.push('dis');
      return `${k}(${flags.join(',')})`;
    });
    if (cControls.length) bits.push(cControls.join(' '));
    items.push({
      key: 'panelState',
      kind: 'panelState',
      title: 'Panel state',
      summary: bits.join(' · '),
      warnings: warningsForAction(warnings, 'panelState'),
      onEdit: () => setOpenEditor({ kind: 'panelState' }),
      onRemove: () => removeAction('panelState'),
    });
  }

  return (
    <section className={cn('space-y-2', !bare && 'border-t pt-3')}>
      {renderHeader ? (
        renderHeader({ count: items.length, onAdd: () => setPickerOpen(true) })
      ) : (
        <div className="flex items-center gap-2">
          {headerIcon ?? <Film className="h-4 w-4 text-muted-foreground" />}
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {title}
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
            <Plus className="h-3 w-3 mr-1" /> {addLabel}
          </Button>
        </div>
      )}

      <div className={cn('space-y-2', !bare && 'ml-6')}>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No actions yet. Use "Add action" to define what this step does.
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
        allowedKinds={allowedKinds}
      />

      <NavigationEditor
        open={openEditor?.kind === 'navigation'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        layerOptions={layerOptions}
        onSave={(viewport: StoryViewport) => patch({ viewport })}
      />
      <ActiveLayersEditor
        open={openEditor?.kind === 'activeLayers'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        sources={sources}
        layerOptions={layerOptions}
        onSave={(activeLayers: StoryActiveLayer[]) => patch({ activeLayers })}
      />
      <BaseLayerEditor
        open={openEditor?.kind === 'baseLayer'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        sources={sources}
        onSave={(baseLayer: string | undefined) => patch({ baseLayer })}
      />
      <ConstraintsEditor
        open={openEditor?.kind === 'constraints'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        sources={sources}
        onSave={(activeLayers: StoryActiveLayer[]) => patch({ activeLayers })}
        onBack={() => { setOpenEditor(null); setPickerOpen(true); }}
      />
      <PanelStateEditor
        open={openEditor?.kind === 'panelState'}
        onOpenChange={(o) => !o && setOpenEditor(null)}
        step={step}
        sources={sources}
        layerOptions={layerOptions}
        onSave={(panelState: StoryPanelState | undefined) => patch({ panelState })}
      />

    </section>
  );
};

export default ActionsAndLayersSection;
