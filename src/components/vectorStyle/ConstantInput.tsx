import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { PropType } from '@/utils/vectorStyle/propertyCatalogues';
import { convertColorToHex } from '@/utils/colorUtils';

export const parseNumberList = (text: string): number[] =>
  text
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(Number)
    .filter(n => Number.isFinite(n));

const sameArray = (a: number[], b: number[]) =>
  a.length === b.length && a.every((n, i) => n === b[i]);

/** Keeps the raw typed text (commas included) while sending parsed numbers upward. */
const NumberArrayInput = ({ value, onChange }: { value: number[]; onChange: (next: number[]) => void }) => {
  const [text, setText] = useState(() => value.join(', '));

  useEffect(() => {
    // Resync only when the value changed elsewhere, so typing isn't overwritten.
    if (!sameArray(parseNumberList(text), value)) setText(value.join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      className="h-8"
      value={text}
      onChange={e => {
        setText(e.target.value);
        onChange(parseNumberList(e.target.value));
      }}
      onBlur={() => setText(parseNumberList(text).join(', '))}
      placeholder="e.g. 5, 5"
    />
  );
};

interface ConstantInputProps {
  type: PropType;
  options?: string[];
  value: string | number | boolean | number[];
  onChange: (next: string | number | boolean | number[]) => void;
}

/**
 * Renders the appropriate flat-value editor for a property type.
 */
const ConstantInput = ({ type, options, value, onChange }: ConstantInputProps) => {
  if (type === 'color') {
    const v = typeof value === 'string' ? value : '#000000';
    // Native color inputs need hex; keep the original string (including alpha)
    // in the text field and the saved style rather than replacing it on load.
    const previewHex = convertColorToHex(v);
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-10 rounded border bg-background p-0"
          value={previewHex}
          onChange={e => onChange(e.target.value)}
        />
        <Input
          className="h-8 flex-1"
          value={v}
          onChange={e => onChange(e.target.value)}
          placeholder="#3b82f6 or rgba(...)"
        />
      </div>
    );
  }

  if (type === 'number') {
    const n = typeof value === 'number' ? value : Number(value) || 0;
    return (
      <Input
        type="number"
        className="h-8"
        value={Number.isFinite(n) ? n : ''}
        onChange={e => {
          const next = e.target.value === '' ? 0 : Number(e.target.value);
          onChange(Number.isFinite(next) ? next : 0);
        }}
      />
    );
  }

  if (type === 'boolean') {
    const b = typeof value === 'boolean' ? value : false;
    return (
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={String(b)}
        onChange={e => onChange(e.target.value === 'true')}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (type === 'numberArray') {
    return (
      <NumberArrayInput
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  // string (with optional enum)
  const s = typeof value === 'string' ? value : '';
  if (options && options.length) {
    return (
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={s}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  return (
    <Input
      className="h-8"
      value={s}
      onChange={e => onChange(e.target.value)}
    />
  );
};

export default ConstantInput;
