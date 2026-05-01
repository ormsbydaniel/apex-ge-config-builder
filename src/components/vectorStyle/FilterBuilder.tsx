import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { FilterClause, FilterModel, FilterOperator } from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';

interface FilterBuilderProps {
  value: FilterModel | undefined;
  onChange: (next: FilterModel | undefined) => void;
  fields: VectorFieldDescriptor[];
  /** When true, the rule is the OL `else` branch and filters are disabled. */
  isElse: boolean;
  onElseChange: (isElse: boolean) => void;
}

const OPERATORS: FilterOperator[] = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not in', 'has'];

const OP_LABEL: Record<FilterOperator, string> = {
  '==': '=',
  '!=': '≠',
  '<': '<',
  '<=': '≤',
  '>': '>',
  '>=': '≥',
  in: 'in',
  'not in': 'not in',
  has: 'has',
};

const ZOOM_FIELD = '__zoom__';

const blankClause = (fields: VectorFieldDescriptor[]): FilterClause => ({
  field: fields[0]?.name ?? '',
  op: '==',
  value: '',
});

const ensureSimple = (model: FilterModel | undefined): Extract<FilterModel, { kind: 'simple' }> => {
  if (model?.kind === 'simple') return model;
  return { kind: 'simple', combinator: 'all', clauses: [] };
};

const FilterBuilder = ({
  value,
  onChange,
  fields,
  isElse,
  onElseChange,
}: FilterBuilderProps) => {
  const mode: 'simple' | 'expression' = value?.kind === 'expression' ? 'expression' : 'simple';

  const setMode = (next: 'simple' | 'expression') => {
    if (next === 'expression') {
      onChange({
        kind: 'expression',
        raw: value?.kind === 'expression' ? value.raw : null,
      });
    } else {
      onChange(ensureSimple(value));
    }
  };

  if (isElse) {
    return (
      <div className="space-y-2">
        <ElseToggle isElse={isElse} onChange={onElseChange} />
        <p className="text-xs text-muted-foreground italic">
          This rule applies when none of the preceding rules matched.
        </p>
      </div>
    );
  }

  const simple = ensureSimple(value);

  const updateClause = (idx: number, patch: Partial<FilterClause>) => {
    const next = simple.clauses.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ ...simple, clauses: next });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Filter mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as 'simple' | 'expression')}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="expression">Expression</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ElseToggle isElse={isElse} onChange={onElseChange} />
      </div>

      {mode === 'simple' ? (
        <>
          {simple.clauses.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="text-xs">Match</Label>
              <Select
                value={simple.combinator}
                onValueChange={(v) =>
                  onChange({ ...simple, combinator: v as 'all' | 'any' })
                }
              >
                <SelectTrigger className="h-7 w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">of the following</span>
            </div>
          )}

          {simple.clauses.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No filter — this rule applies to all features.
            </p>
          )}

          {simple.clauses.map((clause, idx) => {
            const fieldKey = clause.isZoom ? ZOOM_FIELD : clause.field;
            const valueAsArray = Array.isArray(clause.value) ? clause.value : [];
            return (
              <div
                key={idx}
                className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center"
              >
                <Select
                  value={fieldKey}
                  onValueChange={(v) => {
                    if (v === ZOOM_FIELD) {
                      updateClause(idx, { field: 'zoom', isZoom: true });
                    } else {
                      updateClause(idx, { field: v, isZoom: false });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ZOOM_FIELD}>Zoom</SelectItem>
                    {fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={clause.op}
                  onValueChange={(v) =>
                    updateClause(idx, { op: v as FilterOperator })
                  }
                >
                  <SelectTrigger className="h-8 w-[80px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>{OP_LABEL[op]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {clause.op === 'has' ? (
                  <span className="text-xs text-muted-foreground">(presence)</span>
                ) : clause.op === 'in' || clause.op === 'not in' ? (
                  <Input
                    className="h-8 text-xs"
                    placeholder="comma,separated,values"
                    value={valueAsArray.join(',')}
                    onChange={(e) => {
                      const parts = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s !== '');
                      // Try to coerce each to number where possible
                      const coerced = parts.map((p) =>
                        p !== '' && !Number.isNaN(Number(p)) ? Number(p) : p,
                      );
                      updateClause(idx, { value: coerced });
                    }}
                  />
                ) : (
                  <Input
                    className="h-8 text-xs"
                    value={String(clause.value ?? '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const coerced =
                        raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
                      updateClause(idx, { value: coerced });
                    }}
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    onChange({
                      ...simple,
                      clauses: simple.clauses.filter((_, i) => i !== idx),
                    })
                  }
                  aria-label="Remove clause"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...simple,
                  clauses: [...simple.clauses, blankClause(fields)],
                })
              }
            >
              <Plus className="h-3 w-3 mr-1" />
              Add condition
            </Button>
            {simple.clauses.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
              >
                Clear filter
              </Button>
            )}
          </div>
        </>
      ) : (
        <Textarea
          rows={4}
          className="font-mono text-xs"
          value={(() => {
            try {
              return value?.kind === 'expression'
                ? JSON.stringify(value.raw, null, 2)
                : '';
            } catch {
              return '';
            }
          })()}
          onChange={(e) => {
            const text = e.target.value;
            try {
              onChange({ kind: 'expression', raw: JSON.parse(text) });
            } catch {
              onChange({ kind: 'expression', raw: text });
            }
          }}
          placeholder='e.g. [">", ["get", "pop"], 1000000]'
        />
      )}
    </div>
  );
};

const ElseToggle = ({
  isElse,
  onChange,
}: {
  isElse: boolean;
  onChange: (next: boolean) => void;
}) => (
  <label className="flex items-center gap-2 text-xs cursor-pointer">
    <input
      type="checkbox"
      className="h-3.5 w-3.5"
      checked={isElse}
      onChange={(e) => onChange(e.target.checked)}
    />
    Else (otherwise)
  </label>
);

export default FilterBuilder;
