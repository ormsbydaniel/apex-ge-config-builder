import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Filter as FilterIcon } from 'lucide-react';
import FilterBuilder from './FilterBuilder';
import MarkerPanel from './MarkerPanel';
import { FillPanel, LinePanel, LabelPanel } from './SimplePanels';
import { defaultFill, defaultLabel, defaultLine, defaultMarker } from '@/utils/vectorStyle/defaults';
import type { RulePrimitives, StyleRule } from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';

type PrimitiveKey = keyof RulePrimitives;
type TabKey = PrimitiveKey | 'when';

const TABS: { key: TabKey; label: string; glyph: string }[] = [
  { key: 'fill', label: 'Fill', glyph: '▢' },
  { key: 'line', label: 'Line', glyph: '─' },
  { key: 'marker', label: 'Marker', glyph: '●' },
  { key: 'label', label: 'Label', glyph: 'A' },
  { key: 'when', label: 'When', glyph: '' },
];

interface RuleEditorPaneProps {
  rule: StyleRule;
  index: number;
  onChange: (next: StyleRule) => void;
  fields: VectorFieldDescriptor[];
}

const firstActiveTab = (rule: StyleRule): TabKey =>
  (TABS.find((t) => t.key !== 'when' && rule.primitives[t.key as PrimitiveKey])?.key) ?? 'fill';

const RuleEditorPane = ({ rule, index, onChange, fields }: RuleEditorPaneProps) => {
  const [tab, setTab] = useState<TabKey>(() => firstActiveTab(rule));
  // Reset to the first drawing layer when a different rule is selected.
  useEffect(() => { setTab(firstActiveTab(rule)); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstString = fields.find((f) => !f.type || f.type === 'string')?.name;
  const addPrimitive = (key: PrimitiveKey) => {
    const p: RulePrimitives = { ...rule.primitives };
    if (key === 'marker') p.marker = defaultMarker();
    if (key === 'line') p.line = defaultLine();
    if (key === 'fill') p.fill = defaultFill();
    if (key === 'label') p.label = defaultLabel(firstString);
    onChange({ ...rule, primitives: p });
  };
  const removePrimitive = (key: PrimitiveKey) => {
    const p: RulePrimitives = { ...rule.primitives };
    delete p[key];
    onChange({ ...rule, primitives: p });
  };
  const setPrim = <K extends PrimitiveKey>(key: K, value: RulePrimitives[K]) =>
    onChange({ ...rule, primitives: { ...rule.primitives, [key]: value } });

  const hasFilter = rule.else === true || rule.filter?.kind === 'expression' ||
    (rule.filter?.kind === 'simple' && rule.filter.clauses.length > 0);

  const renderPrimitive = (key: PrimitiveKey, label: string) => {
    if (!rule.primitives[key]) {
      return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-xs text-muted-foreground">This rule doesn't draw a {label.toLowerCase()}.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => addPrimitive(key)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add {label.toLowerCase()}
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {key === 'marker' && rule.primitives.marker && (
          <MarkerPanel value={rule.primitives.marker} onChange={(v) => setPrim('marker', v)} fields={fields} />
        )}
        {key === 'line' && rule.primitives.line && (
          <LinePanel values={rule.primitives.line.props} onChange={(props) => setPrim('line', { props })} fields={fields} />
        )}
        {key === 'fill' && rule.primitives.fill && (
          <FillPanel values={rule.primitives.fill.props} onChange={(props) => setPrim('fill', { props })} fields={fields} />
        )}
        {key === 'label' && rule.primitives.label && (
          <LabelPanel values={rule.primitives.label.props} onChange={(props) => setPrim('label', { props })} fields={fields} />
        )}
        <div className="pt-2 border-t">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive"
            onClick={() => removePrimitive(key)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove {label.toLowerCase()} from this rule
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 pb-2">
        <Input
          className="h-8 flex-1 text-sm"
          placeholder={`Rule ${index + 1}`}
          value={rule.name ?? ''}
          onChange={(e) => onChange({ ...rule, name: e.target.value || undefined })}
          aria-label="Rule name"
        />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => {
            const active = t.key === 'when' ? hasFilter : !!rule.primitives[t.key as PrimitiveKey];
            return (
              <TabsTrigger key={t.key} value={t.key} className="shrink-0 text-xs gap-1">
                {t.key === 'when' ? <FilterIcon className="h-3 w-3" /> : <span>{t.glyph}</span>}
                {t.label}
                {active && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary" aria-label="in use" />}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="flex-1 min-h-0 overflow-y-auto pt-3 pr-1">
          {(['fill', 'line', 'marker', 'label'] as PrimitiveKey[]).map((k) => (
            <TabsContent key={k} value={k} className="mt-0">
              {renderPrimitive(k, TABS.find((t) => t.key === k)!.label)}
            </TabsContent>
          ))}
          <TabsContent value="when" className="mt-0">
            <FilterBuilder
              value={rule.filter}
              onChange={(filter) => onChange({ ...rule, filter, else: filter ? false : rule.else })}
              fields={fields}
              isElse={!!rule.else}
              onElseChange={(isElse) => onChange({ ...rule, else: isElse, filter: isElse ? undefined : rule.filter })}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default RuleEditorPane;
