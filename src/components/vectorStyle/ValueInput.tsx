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

type Mode = 'constant' | 'attribute' | 'zoom' | 'expression';
type AttrMethod = 'direct' | 'match' | 'interpolate';

const modeOf = (v: ValueModel): Mode => {
  if (v.kind === 'constant') return 'constant';
  if (v.kind === 'expression') return 'expression';
  if (v.kind === 'zoom') return 'zoom';
  return 'attribute';
};

const attrMethodOf = (v: ValueModel): AttrMethod | null => {
  if (v.kind !== 'attribute') return null;
  return v.mode;
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
    case 'attribute':
      return { kind: 'attribute', field, mode: 'direct' };
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

const buildAttribute = (
  method: AttrMethod,
  field: string,
  prop: PropertyDef,
): ValueModel => {
  switch (method) {
    case 'direct':
      return { kind: 'attribute', field, mode: 'direct' };
    case 'match':
      return {
        kind: 'attribute',
        field,
        mode: 'match',
        stops: [],
        default: defaultConstantFor(prop.type) as any,
      };
    case 'interpolate':
      return {
        kind: 'attribute',
        field,
        mode: 'interpolate',
        interpolation: 'linear',
        stops: [],
      };
  }
};

const interpAvailable = (type: PropType) => type === 'number' || type === 'color';

const MODE_LABEL: Record<Mode, string> = {
  constant: 'Constant',
  attribute: 'From field',
  zoom: 'By zoom',
  expression: 'Expression',
};

const METHOD_LABEL: Record<AttrMethod, string> = {
  direct: 'Direct',
  match: 'When field equals …',
  interpolate: 'Interpolate',
};

const summaryFor = (value: ValueModel): string => {
  if (value.kind === 'attribute') {
    const field = value.field || '—';
    return `From field: ${field} (${METHOD_LABEL[value.mode]})`;
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

  const attrMethod = attrMethodOf(value);
  const attrField = value.kind === 'attribute' ? value.field : '';

  const handleFieldChange = (field: string) => {
    if (value.kind !== 'attribute') return;
    onChange({ ...value, field } as ValueModel);
  };

  const handleMethodChange = (method: AttrMethod) => {
    if (value.kind !== 'attribute') return;
    if (method === value.mode) return;
    onChange(buildAttribute(method, value.field, prop));
  };

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
              <SelectItem value="attribute">{MODE_LABEL.attribute}</SelectItem>
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
        ) : showAdvanced && mode === 'attribute' && value.kind === 'attribute' ? (
          <div className="flex-1 min-w-0">
            <Select value={attrField} onValueChange={handleFieldChange}>
              <SelectTrigger className="h-7 w-[200px] text-xs">
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
        ) : (
          <div className="flex-1" />
        )}
        {advancedToggle}
      </div>

      {/* Compact summary when advanced is collapsed but mode is non-constant */}
      {!advancedOpen && isAdvancedMode && (
        <p className="text-xs text-muted-foreground italic pl-[5.5rem]">
          {summaryFor(value)}
        </p>
      )}

      {advancedOpen && mode === 'attribute' && value.kind === 'attribute' && attrField && (
        <div className="pl-[5.5rem]"><div className="space-y-2 rounded-md border bg-muted/20 p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs shrink-0">Method</Label>
            <Select
              value={attrMethod ?? 'direct'}
              onValueChange={(v) => handleMethodChange(v as AttrMethod)}
            >
              <SelectTrigger className="h-7 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">{METHOD_LABEL.direct}</SelectItem>
                <SelectItem value="match">{METHOD_LABEL.match}</SelectItem>
                {interpAvailable(prop.type) && (
                  <SelectItem value="interpolate">{METHOD_LABEL.interpolate}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {attrField && value.mode === 'match' && (
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

          {attrField && value.mode === 'interpolate' && (
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
        </div></div>
      )}

      {advancedOpen && mode === 'zoom' && value.kind === 'zoom' && (
        <div className="pl-[5.5rem]"><div className="space-y-2 rounded-md border bg-muted/20 p-2">
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
        </div></div>
      )}

      {advancedOpen && mode === 'expression' && value.kind === 'expression' && (
        <div className="pl-[5.5rem]"><Textarea
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
        /></div>
      )}

      {advancedOpen && isAdvancedMode && (
        <div className="flex justify-end pl-[5.5rem]">
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
