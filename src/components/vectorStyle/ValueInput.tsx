import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronsRight, ChevronsLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  'attribute-match': 'By field (match)',
  'attribute-interp': 'By field (interpolate)',
  zoom: 'By zoom',
  expression: 'Expression',
};

const summaryFor = (value: ValueModel): string => {
  if (value.kind === 'attribute') {
    return value.mode === 'match'
      ? `By field (match): ${value.field || '—'}`
      : `By field (interpolate): ${value.field || '—'}`;
  }
  if (value.kind === 'zoom') return 'By zoom';
  if (value.kind === 'expression') return 'Expression';
  return '';
};

const ValueInput = ({ prop, value, onChange, fields }: ValueInputProps) => {
  const mode = modeOf(value);
  const isAdvancedMode = mode !== 'constant';
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(isAdvancedMode);

  const showAdvanced = advancedOpen || isAdvancedMode;

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    onChange(blankFor(next, prop, fields));
  };

  const resetToConstant = () => {
    onChange({ kind: 'constant', value: defaultConstantFor(prop.type) as any });
    setAdvancedOpen(false);
  };

  const advancedToggle = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 shrink-0',
            isAdvancedMode && 'text-primary',
          )}
          aria-label="Advanced value options"
          aria-pressed={showAdvanced}
          onClick={() => setAdvancedOpen(o => !o)}
        >
          {showAdvanced ? (
            <ChevronsLeft className="h-3.5 w-3.5" />
          ) : (
            <ChevronsRight className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{showAdvanced ? 'Collapse' : 'Advanced'}</TooltipContent>
    </Tooltip>
  );

  // Compact, single-line layout when in constant mode and not expanded.
  if (mode === 'constant' && !advancedOpen) {
    return (
      <div className="flex items-center gap-2 md:col-start-1">
        <Label className="text-xs w-20 shrink-0">{prop.label}</Label>
        <div className="flex-1 min-w-0">
          {value.kind === 'constant' && (
            <ConstantInput
              type={prop.type}
              options={prop.options}
              value={value.value}
              onChange={(v) => onChange({ kind: 'constant', value: v })}
            />
          )}
        </div>
        {advancedToggle}
      </div>
    );
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs w-20 shrink-0">{prop.label}</Label>
        {showAdvanced && (
          <Select value={mode} onValueChange={(v) => handleModeChange(v as Mode)}>
            <SelectTrigger className="h-7 w-[180px] shrink-0 text-xs">
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
        )}
        {advancedOpen && mode === 'constant' && value.kind === 'constant' ? (
          <div className="flex-1 min-w-0">
            <ConstantInput
              type={prop.type}
              options={prop.options}
              value={value.value}
              onChange={(v) => onChange({ kind: 'constant', value: v })}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {advancedToggle}
      </div>

      {/* Compact summary when advanced is collapsed but mode is non-constant */}
      {!advancedOpen && isAdvancedMode && (
        <p className="text-xs text-muted-foreground italic">
          {summaryFor(value)}
        </p>
      )}

      {advancedOpen && (mode === 'attribute-match' || mode === 'attribute-interp') &&
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

      {advancedOpen && mode === 'zoom' && value.kind === 'zoom' && (
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

      {advancedOpen && mode === 'expression' && value.kind === 'expression' && (
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

      {advancedOpen && isAdvancedMode && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={resetToConstant}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to constant
          </Button>
        </div>
      )}
    </div>
  );
};

export default ValueInput;
