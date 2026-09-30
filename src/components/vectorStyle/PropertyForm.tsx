import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, X } from 'lucide-react';
import ValueInput from './ValueInput';
import type { ValueModel } from '@/types/vectorStyle';
import type { PropertyDef } from '@/utils/vectorStyle/propertyCatalogues';
import type { VectorFieldDescriptor } from './types';

interface PropertyFormProps {
  propDefs: PropertyDef[];
  values: Record<string, ValueModel>;
  onChange: (next: Record<string, ValueModel>) => void;
  fields: VectorFieldDescriptor[];
}

/** Seed value for a property newly added from the "+ Add property" picker. */
export const seedValueFor = (def: PropertyDef): ValueModel => {
  if (def.options?.length) return { kind: 'constant', value: def.options[0] };
  switch (def.type) {
    case 'color': return { kind: 'constant', value: '#3b82f6' };
    case 'number': return { kind: 'constant', value: def.key.includes('rotation') || def.key.includes('offset') || def.key.includes('angle') ? 0 : 1 };
    case 'numberArray': return { kind: 'constant', value: def.key.includes('dash') ? [4, 4] : [0, 0] };
    case 'boolean': return { kind: 'constant', value: false };
    default: return { kind: 'constant', value: '' };
  }
};

/**
 * Renders the properties present in `values`, plus a "+ Add property" picker
 * listing every catalogued property (core and advanced) not yet set.
 * Properties can be removed so they are omitted from the saved style.
 */
const PropertyForm = ({ propDefs, values, onChange, fields }: PropertyFormProps) => {
  const present = propDefs.filter((d) => values[d.key] !== undefined);
  const missing = propDefs.filter((d) => values[d.key] === undefined);
  const missingCore = missing.filter((d) => !d.advanced);
  const missingAdvanced = missing.filter((d) => d.advanced);

  const add = (def: PropertyDef) => onChange({ ...values, [def.key]: seedValueFor(def) });
  const remove = (key: string) => {
    const next = { ...values };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {present.map((def) => (
        <div key={def.key} className="flex items-start gap-1">
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2">
            <ValueInput
              prop={def}
              value={values[def.key]}
              fields={fields}
              onChange={(next) => onChange({ ...values, [def.key]: next })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            aria-label={`Remove ${def.label}`}
            title={`Remove ${def.label}`}
            onClick={() => remove(def.key)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {missing.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add property
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
            {missingCore.map((d) => (
              <DropdownMenuItem key={d.key} onSelect={() => add(d)} className="text-xs">
                {d.label}
              </DropdownMenuItem>
            ))}
            {missingCore.length > 0 && missingAdvanced.length > 0 && <DropdownMenuSeparator />}
            {missingAdvanced.length > 0 && (
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Advanced</DropdownMenuLabel>
            )}
            {missingAdvanced.map((d) => (
              <DropdownMenuItem key={d.key} onSelect={() => add(d)} className="text-xs">
                {d.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default PropertyForm;
