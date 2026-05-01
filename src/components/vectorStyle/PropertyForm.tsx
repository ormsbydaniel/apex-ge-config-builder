import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

/**
 * Renders a tight 2-column form of properties, with advanced ones tucked behind
 * a "More options" disclosure.
 */
const PropertyForm = ({ propDefs, values, onChange, fields }: PropertyFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const basic = propDefs.filter(p => !p.advanced);
  const advanced = propDefs.filter(p => p.advanced);

  const renderProp = (def: PropertyDef) => {
    const value = values[def.key];
    if (value === undefined) return null;
    return (
      <ValueInput
        key={def.key}
        prop={def}
        value={value}
        fields={fields}
        onChange={(next) => onChange({ ...values, [def.key]: next })}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {basic.map(renderProp)}
      </div>

      {advanced.length > 0 && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowAdvanced(s => !s)}
          >
            {showAdvanced ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            More options
          </Button>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {advanced.map(renderProp)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyForm;
