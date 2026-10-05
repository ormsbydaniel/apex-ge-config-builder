import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, GripVertical } from 'lucide-react';
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

const RuleListPane = ({ rules, selected, onSelect, onMove, onDuplicate, onRemove }: RuleListPaneProps) => {
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);
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
        return (
          <li
            key={idx}
            ref={(el) => { itemRefs.current[idx] = el; }}
            draggable
            onDragStart={(e) => {
              // Browsers (notably Firefox) only start a native drag when data is set.
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(idx));
              setDragFrom(idx);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const raw = e.dataTransfer.getData('text/plain');
              const from = dragFrom ?? (raw !== '' ? Number(raw) : NaN);
              if (Number.isInteger(from) && from !== idx) onMove(from, idx);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
            onClick={() => onSelect(idx)}
            className={cn(
              'group flex items-center gap-1 rounded-md border px-1 py-1 cursor-pointer text-xs',
              idx === selected ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50',
              !enabled && 'opacity-50',
            )}
          >
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-grab" aria-hidden />
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
          </li>
        );
      })}
    </ul>
  );
};

export default RuleListPane;
