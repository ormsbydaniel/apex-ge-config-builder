import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { StoryStep } from '@/types/config';
import {
  CopyFacet, FACET_LABEL, MergeStrategy, FACET_STRATEGIES, STRATEGY_LABEL, facetPresent,
  buildCopyPreview, StepChangePreview, FacetChange,
} from './copySteps';

export interface CopyToStepsResult {
  targetIndices: number[];
  facets: CopyFacet[];
  strategies: Partial<Record<CopyFacet, MergeStrategy>>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceStep: StoryStep;
  storySteps: StoryStep[];
  sourceIndex: number;
  mode: 'single' | 'multi';
  facet?: CopyFacet;
  onApply: (result: CopyToStepsResult) => void;
}

type Stage = 'configure' | 'preview';

export const CopyToStepsDialog: React.FC<Props> = ({
  open, onOpenChange, sourceStep, storySteps, sourceIndex, mode, facet, onApply,
}) => {
  const availableFacets = useMemo<CopyFacet[]>(() => {
    const all: CopyFacet[] = ['navigation', 'baseLayer', 'activeLayers', 'constraints', 'panelState', 'contentDescription'];
    return all.filter((f) => facetPresent(sourceStep, f));
  }, [sourceStep]);

  const [stage, setStage] = useState<Stage>('configure');
  const [selectedFacets, setSelectedFacets] = useState<Set<CopyFacet>>(new Set());
  const [strategies, setStrategies] = useState<Partial<Record<CopyFacet, MergeStrategy>>>({});
  const [targets, setTargets] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    setStage('configure');
    if (mode === 'single' && facet) {
      setSelectedFacets(new Set([facet]));
    } else {
      setSelectedFacets(new Set(availableFacets));
    }
    setStrategies({});
    setTargets(new Set());
  }, [open, mode, facet, availableFacets]);

  const facetsToShow = mode === 'single' && facet ? [facet] : availableFacets;

  const toggleFacet = (f: CopyFacet) => {
    setSelectedFacets((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  };

  const setStrategy = (f: CopyFacet, s: MergeStrategy) =>
    setStrategies((prev) => ({ ...prev, [f]: s }));

  const toggleTarget = (i: number) => {
    if (i === sourceIndex) return;
    setTargets((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const allIndices = storySteps.map((_, i) => i).filter((i) => i !== sourceIndex);
  const bulk = (which: 'all' | 'none' | 'future' | 'previous') => {
    if (which === 'all') setTargets(new Set(allIndices));
    else if (which === 'none') setTargets(new Set());
    else if (which === 'future') setTargets(new Set(allIndices.filter((i) => i > sourceIndex)));
    else setTargets(new Set(allIndices.filter((i) => i < sourceIndex)));
  };

  const facetSummary = (f: CopyFacet): string => {
    switch (f) {
      case 'navigation': {
        const v = sourceStep.viewport;
        if ('zoom' in v) return `Zoom ${v.zoom} · [${v.center.map((n) => n.toFixed(2)).join(', ')}]`;
        if ('fitLayer' in v) return `Fit layer: ${v.fitLayer}`;
        return `Fit extent: [${v.extent.map((n) => n.toFixed(2)).join(', ')}]`;
      }
      case 'baseLayer':
        return sourceStep.baseLayer ?? '';
      case 'activeLayers': {
        const ls = sourceStep.activeLayers ?? [];
        return `${ls.length} layer${ls.length === 1 ? '' : 's'}`;
      }
      case 'constraints': {
        const total = (sourceStep.activeLayers ?? [])
          .reduce((n, l) => n + (l.constraints?.length ?? 0), 0);
        return `${total} constraint${total === 1 ? '' : 's'}`;
      }
      case 'panelState': {
        const ps = sourceStep.panelState;
        if (!ps) return '';
        const bits: string[] = [];
        if (ps.focusLayer) bits.push(`focus: ${ps.focusLayer}`);
        if (ps.tab?.id) bits.push(`tab: ${ps.tab.id}`);
        return bits.join(' · ');
      }
      case 'contentDescription': {
        const d = sourceStep.content?.description ?? '';
        return d.length > 80 ? `${d.slice(0, 77)}…` : d;
      }
    }
  };

  const targetCount = targets.size;
  const canApply =
    targetCount > 0 &&
    (mode === 'single' || selectedFacets.size > 0);

  const effectiveFacets = useMemo(() => Array.from(selectedFacets), [selectedFacets]);
  const effectiveStrategies = useMemo(() => {
    const strat: Partial<Record<CopyFacet, MergeStrategy>> = { ...strategies };
    for (const f of effectiveFacets) {
      if (FACET_STRATEGIES[f].length > 0 && !strat[f]) strat[f] = 'replace';
    }
    return strat;
  }, [strategies, effectiveFacets]);

  const previews: StepChangePreview[] = useMemo(() => {
    if (stage !== 'preview') return [];
    const targetList = Array.from(targets)
      .sort((a, b) => a - b)
      .map((i) => ({ index: i, step: storySteps[i] }));
    return buildCopyPreview(sourceStep, targetList, effectiveFacets, effectiveStrategies);
  }, [stage, targets, storySteps, sourceStep, effectiveFacets, effectiveStrategies]);

  const changedCount = previews.filter((p) => p.anyChange).length;

  const handleApply = () => {
    if (!canApply) return;
    onApply({
      targetIndices: Array.from(targets).sort((a, b) => a - b),
      facets: effectiveFacets,
      strategies: effectiveStrategies,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'single' && facet
              ? `Copy ${FACET_LABEL[facet]} to other steps`
              : 'Copy step contents to other steps'}
            {stage === 'preview' && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — Review changes
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {stage === 'configure' ? (
          <div className="space-y-4 py-1">
            {/* Facets */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What to copy
              </div>
              {facetsToShow.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Nothing on this step is available to copy.
                </p>
              )}
              <ul className="space-y-1.5">
                {facetsToShow.map((f) => {
                  const checked = selectedFacets.has(f);
                  const strategyOptions = FACET_STRATEGIES[f];
                  const supportsStrategy = strategyOptions.length > 0;
                  const strat = strategies[f] ?? 'replace';
                  return (
                    <li key={f} className="rounded-md border px-2 py-1.5">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleFacet(f)}
                          disabled={mode === 'single'}
                          className="mt-0.5"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium">{FACET_LABEL[f]}</span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {facetSummary(f)}
                          </span>
                        </span>
                      </label>
                      {checked && supportsStrategy && (
                        <div className="mt-1.5 ml-6">
                          <RadioGroup
                            value={strat}
                            onValueChange={(v) => setStrategy(f, v as MergeStrategy)}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1"
                          >
                            {strategyOptions.map((opt) => (
                              <div key={opt} className="flex items-center gap-1.5">
                                <RadioGroupItem value={opt} id={`strat-${f}-${opt}`} />
                                <Label htmlFor={`strat-${f}-${opt}`} className="text-xs font-normal cursor-pointer">
                                  {STRATEGY_LABEL[opt]}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Targets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Target steps
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs"
                    onClick={() => bulk('all')}>Select all</Button>
                  <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs"
                    onClick={() => bulk('none')}>Deselect all</Button>
                  <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs"
                    onClick={() => bulk('previous')}>Previous</Button>
                  <Button type="button" size="sm" variant="outline" className="h-6 px-2 text-xs"
                    onClick={() => bulk('future')}>Future</Button>
                </div>
              </div>
              <ScrollArea className="h-56 rounded-md border">
                <ul className="p-1">
                  {storySteps.map((s, i) => {
                    const isSource = i === sourceIndex;
                    const title = s.content?.title ?? s.id ?? '(untitled)';
                    const checked = targets.has(i);
                    return (
                      <li key={`${s.id ?? i}-${i}`}>
                        <label
                          className={cn(
                            'flex items-center gap-2 rounded px-2 py-1.5 text-sm',
                            isSource
                              ? 'opacity-60 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-muted/60',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleTarget(i)}
                            disabled={isSource}
                          />
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full border border-border bg-muted text-[11px] font-semibold text-foreground/70 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate flex-1">{title}</span>
                          {isSource && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              source
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
              <div className="text-xs text-destructive-foreground/90">
                <div className="font-semibold text-destructive">This action cannot be undone from this dialog.</div>
                <div className="text-muted-foreground">
                  The following changes will overwrite step contents on the selected targets. Use the app's history to revert if needed.
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {changedCount} of {previews.length} target step{previews.length === 1 ? '' : 's'} will change.
            </div>

            <ScrollArea className="h-72 rounded-md border">
              <ul className="p-2 space-y-2">
                {previews.map((p) => (
                  <li key={p.targetIndex} className="rounded border bg-card">
                    <div className="flex items-center gap-2 px-2 py-1.5 border-b bg-muted/40">
                      <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full border border-border bg-background text-[11px] font-semibold text-foreground/70">
                        {p.targetIndex + 1}
                      </span>
                      <span className="text-sm font-medium truncate flex-1">{p.targetTitle}</span>
                      {!p.anyChange && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          no change
                        </span>
                      )}
                    </div>
                    <ul className="px-2 py-1.5 space-y-1.5">
                      {p.facets.map((fp) => (
                        <li key={fp.facet} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{FACET_LABEL[fp.facet]}</span>
                            <StrategyChip change={fp.change} strategy={fp.strategy} />
                          </div>
                          <FacetChangeDetail change={fp.change} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {stage === 'configure' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setStage('preview')} disabled={!canApply}>
                Review changes
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStage('configure')}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleApply} disabled={!canApply}>
                Apply to {targetCount} step{targetCount === 1 ? '' : 's'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StrategyChip: React.FC<{ change: FacetChange; strategy: MergeStrategy }> = ({ change, strategy }) => {
  if (change.kind === 'noop') {
    return (
      <span className="inline-flex items-center px-1.5 h-4 rounded text-[10px] uppercase tracking-wide bg-muted text-muted-foreground">
        no change
      </span>
    );
  }
  const label = STRATEGY_LABEL[strategy] ?? 'Replace';
  const isAppendish = strategy === 'append' || strategy === 'insertStart' || strategy === 'insertEnd';
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 h-4 rounded text-[10px] uppercase tracking-wide',
      isAppendish
        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    )}>
      {label}
    </span>
  );
};

const FacetChangeDetail: React.FC<{ change: FacetChange }> = ({ change }) => {
  if (change.kind === 'noop') {
    return <div className="text-muted-foreground italic pl-0.5">Target already matches source.</div>;
  }
  if (change.kind === 'replace') {
    return (
      <div className="text-muted-foreground pl-0.5">
        <span className="line-through opacity-70">{change.before}</span>
        <span className="mx-1">→</span>
        <span className="text-foreground">{change.after}</span>
      </div>
    );
  }
  if (change.kind === 'append') {
    return (
      <div className="text-muted-foreground pl-0.5">
        Keeps {change.keptCount}, adds {change.added.length}:{' '}
        <span className="text-foreground">{change.added.join(', ')}</span>
      </div>
    );
  }
  // constraints
  return (
    <ul className="pl-0.5 space-y-0.5">
      {change.perLayer.map((l) => (
        <li key={l.layerId} className="text-muted-foreground">
          <span className="font-medium text-foreground">{l.layerId}</span>:{' '}
          {change.strategy === 'append' ? (
            <>adds {l.addedLabels.length} ({l.addedLabels.join(', ') || '—'})</>
          ) : (
            <>
              {l.removedLabels.length > 0 && (
                <span className="line-through opacity-70 mr-1">{l.removedLabels.join(', ')}</span>
              )}
              {l.addedLabels.length > 0 && (
                <span className="text-foreground">+{l.addedLabels.join(', ')}</span>
              )}
              {l.removedLabels.length === 0 && l.addedLabels.length === 0 && '(reordered)'}
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export default CopyToStepsDialog;
