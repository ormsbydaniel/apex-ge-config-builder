import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConstantInput from './ConstantInput';
import StopsEditor from './StopsEditor';
import type { ValueModel } from '@/types/vectorStyle';
import type { PropType, PropertyDef } from '@/utils/vectorStyle/propertyCatalogues';
import type { VectorFieldDescriptor } from './types';

interface ValueInputProps {
  prop: PropertyDef;
  value: ValueModel;
  onChange: (next: ValueModel) => void;
  fields: VectorFieldDescriptor[];
}

type Mode = 'constant' | 'attribute-match' | 'attribute-interp' | 'zoom' | 'expression';

const modeOf = (v: ValueModel): Mode => {
  if (v.kind === 'constant') return 'constant';
  if (v.kind === 'expression') return 'expression';
  if (v.kind === 'zoom') return 'zoom';
  return v.mode === 'match' ? 'attribute-match' : 'attribute-interp';
};

const defaultConstantFor = (type: PropType) => {
  switch (type) {
    case 'color': return '#3b82f6';
    case 'number': return 0;
    case 'boolean': return false;
    case 'numberArray': return [];
    default: return '';
  }
};

const blankFor = (mode: Mode, prop: PropertyDef, fields: VectorFieldDescriptor[]): ValueModel => {
  const field = fields[0]?.name ?? '';
  switch (mode) {
    case 'constant':
      return { kind: 'constant', value: defaultConstantFor(prop.type) as any };
    case 'attribute-match':
      return {
        kind: 'attribute',
        field,
        mode: 'match',
        stops: [],
        default: defaultConstantFor(prop.type) as any,
      };
    case 'attribute-interp':
      return {
        kind: 'attribute',
        field,
        mode: 'interpolate',
        interpolation: 'linear',
        stops: [],
      };
    case 'zoom':
      return {
        kind: 'zoom',
        mode: 'interpolate',
        interpolation: 'linear',
        stops: [],
      };
    case 'expression':
      return { kind: 'expression', raw: null };
  }
};

const interpAvailable = (type: PropType) => type === 'number' || type === 'color';

const MODE_LABEL: Record<Mode, string> = {
  constant: 'Constant',
  'attribute-match': 'By attribute (match)',
  'attribute-interp': 'By attribute (interpolate)',
  zoom: 'By zoom',
  expression: 'Expression',
};

const ValueInput = ({ prop, value, onChange, fields }: ValueInputProps) => {
  const mode = modeOf(value);

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    onChange(blankFor(next, prop, fields));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs flex-1">{prop.label}</Label>
        <Select value={mode} onValueChange={(v) => handleModeChange(v as Mode)}>
          <SelectTrigger className="h-7 w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="constant">{MODE_LABEL.constant}</SelectItem>
            <SelectItem value="attribute-match">{MODE_LABEL['attribute-match']}</SelectItem>
            {interpAvailable(prop.type) && (
              <SelectItem value="attribute-interp">{MODE_LABEL['attribute-interp']}</SelectItem>
            )}
            {interpAvailable(prop.type) && (
              <SelectItem value="zoom">{MODE_LABEL.zoom}</SelectItem>
            )}
            <SelectItem value="expression">{MODE_LABEL.expression}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'constant' && value.kind === 'constant' && (
        <ConstantInput
          type={prop.type}
          options={prop.options}
          value={value.value}
          onChange={(v) => onChange({ kind: 'constant', value: v })}
        />
      )}

      {(mode === 'attribute-match' || mode === 'attribute-interp') &&
        value.kind === 'attribute' && (
          <div className="space-y-2 rounded-md border bg-muted/20 p-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs w-16">Attribute</Label>
              <Select
                value={value.field}
                onValueChange={(field) =>
                  onChange({ ...value, field } as ValueModel)
                }
              >
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue placeholder="Pick a field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.length === 0 ? (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      No detected fields
                    </div>
                  ) : (
                    fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                        {f.type ? ` (${f.type})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {mode === 'attribute-match' && value.mode === 'match' && (
              <>
                <StopsEditor
                  inputType="string"
                  outputType={prop.type}
                  outputOptions={prop.options}
                  inputLabel="When equals"
                  outputLabel="Use"
                  stops={value.stops}
                  onChange={(stops) =>
                    onChange({ ...value, stops: stops as any } as ValueModel)
                  }
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-16">Default</Label>
                  <div className="flex-1">
                    <ConstantInput
                      type={prop.type}
                      options={prop.options}
                      value={(value.default ?? defaultConstantFor(prop.type)) as any}
                      onChange={(v) =>
                        onChange({ ...value, default: v } as ValueModel)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'attribute-interp' && value.mode === 'interpolate' && (
              <StopsEditor
                inputType="number"
                outputType={prop.type}
                outputOptions={prop.options}
                inputLabel="At value"
                outputLabel="Use"
                stops={value.stops}
                onChange={(stops) =>
                  onChange({ ...value, stops: stops as any } as ValueModel)
                }
              />
            )}
          </div>
        )}

      {mode === 'zoom' && value.kind === 'zoom' && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-2">
          <StopsEditor
            inputType="number"
            outputType={prop.type}
            outputOptions={prop.options}
            inputLabel="At zoom"
            outputLabel="Use"
            stops={value.stops}
            onChange={(stops) =>
              onChange({ ...value, stops: stops as any } as ValueModel)
            }
          />
        </div>
      )}

      {mode === 'expression' && value.kind === 'expression' && (
        <Textarea
          className="font-mono text-xs"
          rows={3}
          value={(() => {
            try {
              return JSON.stringify(value.raw, null, 2);
            } catch {
              return String(value.raw ?? '');
            }
          })()}
          onChange={(e) => {
            const text = e.target.value;
            try {
              const parsed = JSON.parse(text);
              onChange({ kind: 'expression', raw: parsed });
            } catch {
              onChange({ kind: 'expression', raw: text });
            }
          }}
          placeholder='e.g. ["get", "name"]'
        />
      )}
    </div>
  );
};

export default ValueInput;
