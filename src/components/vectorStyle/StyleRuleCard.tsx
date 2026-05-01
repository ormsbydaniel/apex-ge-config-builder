import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown as ChevronDownArrow,
  Eye,
  EyeOff,
  Filter as FilterIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FilterBuilder from './FilterBuilder';
import MarkerPanel from './MarkerPanel';
import { FillPanel, LinePanel, LabelPanel } from './SimplePanels';
import {
  defaultFill,
  defaultLabel,
  defaultLine,
  defaultMarker,
} from '@/utils/vectorStyle/defaults';
import type {
  RulePrimitives,
  StyleRule,
} from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';

interface StyleRuleCardProps {
  index: number;
  total: number;
  rule: StyleRule;
  onChange: (next: StyleRule) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  fields: VectorFieldDescriptor[];
}

type PrimitiveKey = keyof RulePrimitives;

const PRIMITIVE_LABEL: Record<PrimitiveKey, string> = {
  marker: 'Marker',
  line: 'Line',
  fill: 'Fill',
  label: 'Label',
};

const PRIMITIVE_GLYPH: Record<PrimitiveKey, string> = {
  marker: '●',
  line: '─',
  fill: '▢',
  label: 'A',
};

const summary = (rule: StyleRule): string => {
  const enabled = (Object.keys(rule.primitives) as PrimitiveKey[]).filter(
    (k) => rule.primitives[k],
  );
  const chips = enabled.length
    ? enabled.map((k) => `${PRIMITIVE_GLYPH[k]} ${PRIMITIVE_LABEL[k]}`).join(' + ')
    : 'No drawing layers';
  let when = '';
  if (rule.else) when = ' • else';
  else if (rule.filter?.kind === 'simple' && rule.filter.clauses.length > 0) {
    when = ` • when ${rule.filter.clauses.length} condition${
      rule.filter.clauses.length === 1 ? '' : 's'
    }`;
  } else if (rule.filter?.kind === 'expression') {
    when = ' • custom filter';
  }
  return `${chips}${when}`;
};

const StyleRuleCard = ({
  index,
  total,
  rule,
  onChange,
  onDuplicate,
  onRemove,
  onMove,
  fields,
}: StyleRuleCardProps) => {
  const [open, setOpen] = useState(true);
  const enabled = rule.enabled !== false;

  const hasFilter =
    rule.else === true ||
    (rule.filter?.kind === 'simple' && rule.filter.clauses.length > 0) ||
    rule.filter?.kind === 'expression';
  const [whenOpen, setWhenOpen] = useState(hasFilter);
  const whenActive = whenOpen || hasFilter;

  const toggleWhen = () => {
    if (whenActive) {
      // Turning off: clear any filter / else and hide the panel.
      if (hasFilter) {
        onChange({ ...rule, filter: undefined, else: false });
      }
      setWhenOpen(false);
    } else {
      setWhenOpen(true);
    }
  };

  const togglePrimitive = (key: PrimitiveKey) => {
    const current = rule.primitives[key];
    const nextPrims: RulePrimitives = { ...rule.primitives };
    if (current) {
      delete nextPrims[key];
    } else {
      const firstStringField = fields.find((f) => !f.type || f.type === 'string')?.name;
      switch (key) {
        case 'marker': nextPrims.marker = defaultMarker(); break;
        case 'line': nextPrims.line = defaultLine(); break;
        case 'fill': nextPrims.fill = defaultFill(); break;
        case 'label': nextPrims.label = defaultLabel(firstStringField); break;
      }
    }
    onChange({ ...rule, primitives: nextPrims });
  };

  return (
    <div className={cn('rounded-md border bg-card', !enabled && 'opacity-60')}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 p-2">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <Input
            className="h-7 flex-1 text-sm"
            placeholder={`Rule ${index + 1}`}
            value={rule.name ?? ''}
            onChange={(e) => onChange({ ...rule, name: e.target.value || undefined })}
          />
          <div className="flex flex-col">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-3.5 w-7"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              aria-label="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-3.5 w-7"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
              aria-label="Move down"
            >
              <ChevronDownArrow className="h-3 w-3" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onChange({ ...rule, enabled: !enabled })}
            aria-label={enabled ? 'Disable rule' : 'Enable rule'}
          >
            {enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onDuplicate}
            aria-label="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onRemove}
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {!open && (
          <div className="px-3 pb-2 text-xs text-muted-foreground">{summary(rule)}</div>
        )}

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* Primitive chips */}
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(PRIMITIVE_LABEL) as PrimitiveKey[]).map((key) => {
                const active = !!rule.primitives[key];
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => togglePrimitive(key)}
                  >
                    <span className="mr-1">{PRIMITIVE_GLYPH[key]}</span>
                    {PRIMITIVE_LABEL[key]}
                  </Button>
                );
              })}
              <div className="mx-1 h-5 w-px bg-border" aria-hidden />
              <Button
                type="button"
                variant={whenActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={toggleWhen}
              >
                <FilterIcon className="mr-1 h-3 w-3" />
                When
              </Button>
            </div>

            {/* Drawing layers */}
            {rule.primitives.marker && (
              <PanelSection title="Marker">
                <MarkerPanel
                  value={rule.primitives.marker}
                  onChange={(marker) =>
                    onChange({ ...rule, primitives: { ...rule.primitives, marker } })
                  }
                  fields={fields}
                />
              </PanelSection>
            )}
            {rule.primitives.line && (
              <PanelSection title="Line">
                <LinePanel
                  values={rule.primitives.line.props}
                  onChange={(props) =>
                    onChange({
                      ...rule,
                      primitives: { ...rule.primitives, line: { props } },
                    })
                  }
                  fields={fields}
                />
              </PanelSection>
            )}
            {rule.primitives.fill && (
              <PanelSection title="Fill">
                <FillPanel
                  values={rule.primitives.fill.props}
                  onChange={(props) =>
                    onChange({
                      ...rule,
                      primitives: { ...rule.primitives, fill: { props } },
                    })
                  }
                  fields={fields}
                />
              </PanelSection>
            )}
            {rule.primitives.label && (
              <PanelSection title="Label">
                <LabelPanel
                  values={rule.primitives.label.props}
                  onChange={(props) =>
                    onChange({
                      ...rule,
                      primitives: { ...rule.primitives, label: { props } },
                    })
                  }
                  fields={fields}
                />
              </PanelSection>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const PanelSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-md border bg-muted/10 p-2">
    <Label className="text-xs font-semibold mb-2 block">{title}</Label>
    {children}
  </div>
);

export default StyleRuleCard;
