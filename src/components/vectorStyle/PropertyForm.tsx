import React from 'react';
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
 * Renders a tight 2-column form of properties. Only properties that have a
 * value present in `values` are rendered.
 */
const PropertyForm = ({ propDefs, values, onChange, fields }: PropertyFormProps) => {
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
    <div className="space-y-2">
      {propDefs.map(renderProp)}
    </div>
  );
};

export default PropertyForm;
