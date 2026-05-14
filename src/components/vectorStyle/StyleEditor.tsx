import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import StyleRuleCard from './StyleRuleCard';
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

  const removeRule = (idx: number) => onChange(rules.filter((_, i) => i !== idx));

  const duplicateRule = (idx: number) => {
    const copy = JSON.parse(JSON.stringify(rules[idx])) as StyleRule;
    if (copy.name) copy.name = `${copy.name} copy`;
    onChange([...rules.slice(0, idx + 1), copy, ...rules.slice(idx + 1)]);
  };

  const moveRule = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= rules.length) return;
    const next = [...rules];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  const addRule = (preset: Preset) => onChange([...rules, newRule(preset)]);

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
      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <StyleRuleCard
            key={idx}
            index={idx}
            total={rules.length}
            rule={rule}
            onChange={(next) => updateRule(idx, next)}
            onDuplicate={() => duplicateRule(idx)}
            onRemove={() => removeRule(idx)}
            onMove={(dir) => moveRule(idx, dir)}
            fields={fields}
          />
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">
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
  );
};

export default StyleEditor;
