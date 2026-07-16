import React, { useEffect, useMemo, useState } from 'react';
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
  CopyFacet, FACET_LABEL, MergeStrategy, STRATEGY_FACETS, facetPresent,
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

export const CopyToStepsDialog: React.FC<Props> = ({
  open, onOpenChange, sourceStep, storySteps, sourceIndex, mode, facet, onApply,
}) => {
  const availableFacets = useMemo<CopyFacet[]>(() => {
    const all: CopyFacet[] = ['navigation', 'baseLayer', 'activeLayers', 'constraints', 'panelState'];
    return all.filter((f) => facetPresent(sourceStep, f));
  }, [sourceStep]);

  const [selectedFacets, setSelectedFacets] = useState<Set<CopyFacet>>(new Set());
  const [strategies, setStrategies] = useState<Partial<Record<CopyFacet, MergeStrategy>>>({});
  const [targets, setTargets] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
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
    }
  };

  const targetCount = targets.size;
  const canApply =
    targetCount > 0 &&
    (mode === 'single' || selectedFacets.size > 0);

  const handleApply = () => {
    if (!canApply) return;
    const facets = Array.from(selectedFacets);
    // Fill in default strategies for facets that need them.
    const strat: Partial<Record<CopyFacet, MergeStrategy>> = { ...strategies };
    for (const f of facets) {
      if (STRATEGY_FACETS.includes(f) && !strat[f]) strat[f] = 'replace';
    }
    onApply({
      targetIndices: Array.from(targets).sort((a, b) => a - b),
      facets,
      strategies: strat,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'single' && facet
              ? `Copy ${FACET_LABEL[facet]} to other steps`
              : 'Copy step contents to other steps'}
          </DialogTitle>
        </DialogHeader>

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
                const supportsStrategy = STRATEGY_FACETS.includes(f);
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
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="replace" id={`strat-${f}-replace`} />
                            <Label htmlFor={`strat-${f}-replace`} className="text-xs font-normal cursor-pointer">
                              Replace
                            </Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="append" id={`strat-${f}-append`} />
                            <Label htmlFor={`strat-${f}-append`} className="text-xs font-normal cursor-pointer">
                              Append
                            </Label>
                          </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={!canApply}>
            Copy to {targetCount} step{targetCount === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyToStepsDialog;
