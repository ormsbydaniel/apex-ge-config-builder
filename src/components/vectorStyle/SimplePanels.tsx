import React from 'react';
import PropertyForm from './PropertyForm';
import { FILL_PROPS, LINE_PROPS, LABEL_PROPS } from '@/utils/vectorStyle/propertyCatalogues';
import type { ValueModel } from '@/types/vectorStyle';
import type { VectorFieldDescriptor } from './types';

interface SimplePanelProps {
  values: Record<string, ValueModel>;
  onChange: (next: Record<string, ValueModel>) => void;
  fields: VectorFieldDescriptor[];
}

export const FillPanel = (props: SimplePanelProps) => (
  <PropertyForm propDefs={FILL_PROPS} {...props} />
);

export const LinePanel = (props: SimplePanelProps) => (
  <PropertyForm propDefs={LINE_PROPS} {...props} />
);

export const LabelPanel = (props: SimplePanelProps) => (
  <PropertyForm propDefs={LABEL_PROPS} {...props} />
);
