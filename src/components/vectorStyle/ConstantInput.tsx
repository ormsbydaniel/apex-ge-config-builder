import React from 'react';
import { Input } from '@/components/ui/input';
import type { PropType } from '@/utils/vectorStyle/propertyCatalogues';

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
    // Native color input only accepts #rrggbb. Show alongside a text field so
    // users can paste rgba()/hsl() strings if they need to.
    const showHex = /^#[0-9a-fA-F]{6}$/.test(v);
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-10 rounded border bg-background p-0"
          value={showHex ? v : '#000000'}
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
    const arr = Array.isArray(value) ? value : [];
    return (
      <Input
        className="h-8"
        value={arr.join(', ')}
        onChange={e => {
          const next = e.target.value
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => Number.isFinite(n));
          onChange(next);
        }}
        placeholder="e.g. 5, 5"
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
