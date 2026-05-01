import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import ConstantInput from './ConstantInput';
import type { PropType } from '@/utils/vectorStyle/propertyCatalogues';
import type { Stop, AttributeStop } from '@/types/vectorStyle';

interface StopsEditorProps {
  /** 'attribute-match' uses string keys; 'attribute-interp' / 'zoom' use numeric inputs. */
  inputType: 'string' | 'number';
  outputType: PropType;
  outputOptions?: string[];
  stops: (Stop | AttributeStop)[];
  onChange: (stops: (Stop | AttributeStop)[]) => void;
  inputLabel: string;
  outputLabel: string;
}

const defaultValueFor = (type: PropType): any => {
  switch (type) {
    case 'color': return '#000000';
    case 'number': return 0;
    case 'boolean': return false;
    case 'numberArray': return [];
    default: return '';
  }
};

/**
 * Edits the (input, output) pairs that drive `match` / `interpolate` expressions.
 */
const StopsEditor = ({
  inputType,
  outputType,
  outputOptions,
  stops,
  onChange,
  inputLabel,
  outputLabel,
}: StopsEditorProps) => {
  const update = (idx: number, patch: Partial<Stop & AttributeStop>) => {
    const next = stops.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const remove = (idx: number) => onChange(stops.filter((_, i) => i !== idx));

  const add = () => {
    const lastInput = stops.length
      ? (stops[stops.length - 1] as any)[inputType === 'number' ? 'input' : 'key']
      : undefined;
    const newInput =
      inputType === 'number'
        ? typeof lastInput === 'number'
          ? lastInput + 1
          : 0
        : '';
    onChange([
      ...stops,
      inputType === 'number'
        ? ({ input: newInput, value: defaultValueFor(outputType) } as Stop)
        : ({ key: newInput, value: defaultValueFor(outputType) } as AttributeStop),
    ]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <span>{inputLabel}</span>
        <span>{outputLabel}</span>
        <span />
      </div>
      {stops.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No stops yet — add one below.</p>
      )}
      {stops.map((s, idx) => {
        const input = inputType === 'number' ? (s as Stop).input : (s as AttributeStop).key;
        return (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            {inputType === 'number' ? (
              <Input
                type="number"
                className="h-8"
                value={typeof input === 'number' ? input : ''}
                onChange={e => update(idx, { input: Number(e.target.value) } as any)}
              />
            ) : (
              <Input
                className="h-8"
                value={typeof input === 'string' ? input : String(input ?? '')}
                onChange={e => update(idx, { key: e.target.value } as any)}
              />
            )}
            <ConstantInput
              type={outputType}
              options={outputOptions}
              value={s.value as any}
              onChange={v => update(idx, { value: v } as any)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => remove(idx)}
              aria-label="Remove stop"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3 w-3 mr-1" />
        Add stop
      </Button>
    </div>
  );
};

export default StopsEditor;
