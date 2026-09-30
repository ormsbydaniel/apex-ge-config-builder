import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import RuleListPane from './RuleListPane';
import RuleEditorPane from './RuleEditorPane';
import {
  defaultFill,
  defaultLabel,
  defaultLine,
  defaultMarker,
} from '@/utils/vectorStyle/defaults';
import type { StyleRule } from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';

interface StyleEditorProps {
  rules: StyleRule[];
  onChange: (next: StyleRule[]) => void;
  fields: VectorFieldDescriptor[];
  fallbackCount?: number;
}

type Preset = 'marker' | 'line' | 'fill' | 'label' | 'blank';

const StyleEditor = ({ rules, onChange, fields, fallbackCount = 0 }: StyleEditorProps) => {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (selected > rules.length - 1) setSelected(Math.max(0, rules.length - 1));
  }, [rules.length, selected]);
  const firstString = fields.find((f) => !f.type || f.type === 'string')?.name;

  const newRule = (preset: Preset): StyleRule => {
    const base: StyleRule = { enabled: true, primitives: {} };
    switch (preset) {
      case 'marker': return { ...base, primitives: { marker: defaultMarker() } };
      case 'line': return { ...base, primitives: { line: defaultLine() } };
      case 'fill': return { ...base, primitives: { fill: defaultFill() } };
      case 'label': return { ...base, primitives: { label: defaultLabel(firstString) } };
      case 'blank': return base;
    }
  };

  const updateRule = (idx: number, next: StyleRule) =>
    onChange(rules.map((r, i) => (i === idx ? next : r)));

  const removeRule = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx));
    setSelected((s) => Math.max(0, s >= idx ? s - 1 : s));
  };

  const duplicateRule = (idx: number) => {
    const copy = JSON.parse(JSON.stringify(rules[idx])) as StyleRule;
    if (copy.name) copy.name = `${copy.name} copy`;
    onChange([...rules.slice(0, idx + 1), copy, ...rules.slice(idx + 1)]);
    setSelected(idx + 1);
  };

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules.length || from === to) return;
    const next = [...rules];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    // Keep the moved rule selected.
    setSelected((s) => (s === from ? to : from < s && to >= s ? s - 1 : from > s && to <= s ? s + 1 : s));
  };

  const addRule = (preset: Preset) => {
    onChange([...rules, newRule(preset)]);
    setSelected(rules.length);
  };

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <p className="text-sm text-muted-foreground">No style rules yet — start with one:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button type="button" variant="outline" onClick={() => addRule('marker')}>
            <span className="mr-1">●</span> Add markers
          </Button>
          <Button type="button" variant="outline" onClick={() => addRule('line')}>
            <span className="mr-1">─</span> Add lines
          </Button>
          <Button type="button" variant="outline" onClick={() => addRule('fill')}>
            <span className="mr-1">▢</span> Add fills
          </Button>
          <Button type="button" variant="outline" onClick={() => addRule('label')}>
            <span className="mr-1">A</span> Add labels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fallbackCount > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-2 text-xs">
          {fallbackCount} item{fallbackCount === 1 ? '' : 's'} opened in expression mode — they couldn't be mapped to a structured form, but will save back unchanged.
        </div>
      )}
      <div className="grid grid-cols-[minmax(220px,30%)_1fr] gap-3 min-h-[420px]">
        <div className="space-y-2 border-r pr-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Rules — drawn top to bottom
          </p>
          <RuleListPane
            rules={rules}
            selected={Math.min(selected, rules.length - 1)}
            onSelect={setSelected}
            onMove={moveRule}
            onToggle={(i) => updateRule(i, { ...rules[i], enabled: rules[i].enabled === false })}
          />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add rule
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => addRule('marker')}>
              <span className="mr-2">●</span> Marker
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => addRule('line')}>
              <span className="mr-2">─</span> Line
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => addRule('fill')}>
              <span className="mr-2">▢</span> Fill
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => addRule('label')}>
              <span className="mr-2">A</span> Label
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => addRule('blank')}>
              Blank
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
        <div className="min-w-0">
          {rules[Math.min(selected, rules.length - 1)] && (
            <RuleEditorPane
              index={Math.min(selected, rules.length - 1)}
              rule={rules[Math.min(selected, rules.length - 1)]}
              onChange={(next) => updateRule(Math.min(selected, rules.length - 1), next)}
              onDuplicate={() => duplicateRule(Math.min(selected, rules.length - 1))}
              onRemove={() => removeRule(Math.min(selected, rules.length - 1))}
              fields={fields}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
