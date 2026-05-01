import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PropertyForm from './PropertyForm';
import {
  CIRCLE_MARKER_PROPS,
  ICON_MARKER_PROPS,
  SHAPE_MARKER_PROPS,
} from '@/utils/vectorStyle/propertyCatalogues';
import type { MarkerPrimitive, MarkerSubMode } from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';
import {
  defaultMarker,
} from '@/utils/vectorStyle/defaults';

interface MarkerPanelProps {
  value: MarkerPrimitive;
  onChange: (next: MarkerPrimitive) => void;
  fields: VectorFieldDescriptor[];
}

const propsForSubMode = (subMode: MarkerSubMode) => {
  switch (subMode) {
    case 'circle': return CIRCLE_MARKER_PROPS;
    case 'icon': return ICON_MARKER_PROPS;
    case 'shape': return SHAPE_MARKER_PROPS;
  }
};

const blankPropsForSubMode = (subMode: MarkerSubMode): MarkerPrimitive['props'] => {
  if (subMode === 'circle') return defaultMarker().props;
  // For icon/shape, start with empty values and let the user add them via constants.
  return Object.fromEntries(
    propsForSubMode(subMode).map((p) => [
      p.key,
      { kind: 'constant' as const, value: p.type === 'number' ? 0 : '' },
    ]),
  );
};

const MarkerPanel = ({ value, onChange, fields }: MarkerPanelProps) => {
  const handleSubModeChange = (next: MarkerSubMode) => {
    if (next === value.subMode) return;
    // Drop properties from the previous sub-mode and seed defaults for the new one.
    onChange({ subMode: next, props: blankPropsForSubMode(next) });
  };

  const defs = propsForSubMode(value.subMode);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Marker type</Label>
        <Select
          value={value.subMode}
          onValueChange={(v) => handleSubModeChange(v as MarkerSubMode)}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="icon">Icon</SelectItem>
            <SelectItem value="shape">Shape</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <PropertyForm
        propDefs={defs}
        values={value.props}
        onChange={(props) => onChange({ ...value, props })}
        fields={fields}
      />
    </div>
  );
};

export default MarkerPanel;
