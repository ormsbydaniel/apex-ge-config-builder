import React, { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { StyleRule, ValueModel } from '@/types/vectorStyle';

interface RuleListPaneProps {
  rules: StyleRule[];
  selected: number;
  onSelect: (idx: number) => void;
  onMove: (from: number, to: number) => void;
  onDuplicate: (idx: number) => void;
  onRemove: (idx: number) => void;
}

const SWATCH_KEYS = [
  'fill-color', 'stroke-color', 'circle-fill-color', 'shape-fill-color', 'icon-color', 'text-fill-color',
];

/** Collect up to 4 display colours from a rule's primitives. */
export const ruleSwatches = (rule: StyleRule): string[] => {
  const out: string[] = [];
  const collect = (v: ValueModel | undefined) => {
    if (!v) return;
    if (v.kind === 'constant' && typeof v.value === 'string') out.push(v.value);
    else if (v.kind === 'attribute' && 'stops' in v && Array.isArray((v as any).stops)) {
      for (const s of (v as any).stops) {
        const c = s?.output ?? s?.value;
        if (typeof c === 'string') out.push(c);
      }
    }
  };
  for (const prim of Object.values(rule.primitives)) {
    if (!prim) continue;
    for (const k of SWATCH_KEYS) collect(prim.props[k]);
  }
  return Array.from(new Set(out)).slice(0, 4);
};

export const filterSummary = (rule: StyleRule): string => {
  if (rule.else) return 'else (everything else)';
  const f = rule.filter;
  if (!f) return 'all features';
  if (f.kind === 'expression') return 'custom filter';
  if (f.clauses.length === 0) return 'all features';
  return f.clauses
    .map((c: any) => `${c.field ?? '?'} ${c.op ?? '='} ${Array.isArray(c.value) ? c.value.join(', ') : c.value ?? ''}`.trim())
    .join(f.combinator === 'any' ? ' OR ' : ' AND ');
};

const GLYPH: Record<string, string> = { marker: '●', line: '─', fill: '▢', label: 'A' };

const CLICK_DELAY = 250;

interface RuleMoveControlsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const RuleMoveControls = ({
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  canMoveUp,
  canMoveDown,
}: RuleMoveControlsProps) => {
  const upTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
    if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
  }, []);

  const moveUp = useCallback(() => {
    if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
    upTimeoutRef.current = setTimeout(() => {
      if (canMoveUp) onMoveUp();
    }, CLICK_DELAY);
  }, [canMoveUp, onMoveUp]);

  const moveDown = useCallback(() => {
    if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    downTimeoutRef.current = setTimeout(() => {
      if (canMoveDown) onMoveDown();
    }, CLICK_DELAY);
  }, [canMoveDown, onMoveDown]);

  const moveToTop = useCallback(() => {
    if (upTimeoutRef.current) clearTimeout(upTimeoutRef.current);
    if (canMoveUp) onMoveToTop();
  }, [canMoveUp, onMoveToTop]);

  const moveToBottom = useCallback(() => {
    if (downTimeoutRef.current) clearTimeout(downTimeoutRef.current);
    if (canMoveDown) onMoveToBottom();
  }, [canMoveDown, onMoveToBottom]);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex shrink-0 flex-col gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-5 w-5 border border-muted bg-background p-0 hover:bg-muted"
              disabled={!canMoveUp}
              onClick={moveUp}
              onDoubleClick={moveToTop}
              aria-label="Move rule up, double-click to move to top"
            >
              <ArrowUp className="h-2.5 w-2.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Move up (double-click for top)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-5 w-5 border border-muted bg-background p-0 hover:bg-muted"
              disabled={!canMoveDown}
              onClick={moveDown}
              onDoubleClick={moveToBottom}
              aria-label="Move rule down, double-click to move to bottom"
            >
              <ArrowDown className="h-2.5 w-2.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Move down (double-click for bottom)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

const RuleListPane = ({ rules, selected, onSelect, onMove, onDuplicate, onRemove }: RuleListPaneProps) => {
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);

  // Keep the selected rule visible in the scrollable list (e.g. after a recipe appends a rule).
  React.useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView?.({ block: 'nearest' });
  }, [selected, rules.length]);

  return (
    <ul className="space-y-1" aria-label="Style rules">
      {rules.map((rule, idx) => {
        const enabled = rule.enabled !== false;
        const swatches = ruleSwatches(rule);
        const lastMovableIndex = rules.findIndex((candidate) => candidate.else);
        const bottomIndex = lastMovableIndex === -1 ? rules.length - 1 : lastMovableIndex - 1;
        const canMoveUp = !rule.else && idx > 0;
        const canMoveDown = !rule.else && idx < bottomIndex;
        return (
          <li
            key={idx}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className="flex items-center gap-1"
          >
            <div
              onClick={() => onSelect(idx)}
              className={cn(
                'group flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-md border px-1 py-1 text-xs',
                idx === selected ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50',
                !enabled && 'opacity-50',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium truncate">{rule.name || `Rule ${idx + 1}`}</span>
                  <span className="text-muted-foreground shrink-0">
                    {Object.keys(rule.primitives).filter((k) => (rule.primitives as any)[k]).map((k) => GLYPH[k]).join(' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {swatches.map((c) => (
                    <span key={c} className="h-2.5 w-2.5 rounded-sm border shrink-0" style={{ background: c }} />
                  ))}
                  <span className="font-mono text-[10px] text-muted-foreground truncate">{filterSummary(rule)}</span>
                </div>
              </div>
              <TooltipProvider delayDuration={400}>
                <div className="flex shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => onDuplicate(idx)} aria-label="Duplicate rule">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate rule</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                        onClick={() => onRemove(idx)} aria-label="Delete rule">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete rule</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
            <RuleMoveControls
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={() => onMove(idx, idx - 1)}
              onMoveDown={() => onMove(idx, idx + 1)}
              onMoveToTop={() => onMove(idx, 0)}
              onMoveToBottom={() => onMove(idx, bottomIndex)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default RuleListPane;
