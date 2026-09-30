import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StyleRule, ValueModel } from '@/types/vectorStyle';

interface RuleListPaneProps {
  rules: StyleRule[];
  selected: number;
  onSelect: (idx: number) => void;
  onMove: (from: number, to: number) => void;
  onToggle: (idx: number) => void;
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

const RuleListPane = ({ rules, selected, onSelect, onMove, onToggle }: RuleListPaneProps) => {
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);

  return (
    <ul className="space-y-1" aria-label="Style rules">
      {rules.map((rule, idx) => {
        const enabled = rule.enabled !== false;
        const swatches = ruleSwatches(rule);
        return (
          <li
            key={idx}
            draggable
            onDragStart={() => setDragFrom(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null && dragFrom !== idx) onMove(dragFrom, idx);
              setDragFrom(null);
            }}
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
            <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
              <Button type="button" variant="ghost" size="icon" className="h-3.5 w-6" disabled={idx === 0}
                onClick={() => onMove(idx, idx - 1)} aria-label="Move rule up">
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-3.5 w-6" disabled={idx === rules.length - 1}
                onClick={() => onMove(idx, idx + 1)} aria-label="Move rule down">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0"
              onClick={(e) => { e.stopPropagation(); onToggle(idx); }}
              aria-label={enabled ? 'Hide rule' : 'Show rule'}>
              {enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          </li>
        );
      })}
    </ul>
  );
};

export default RuleListPane;
