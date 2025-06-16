
import React from 'react';
import { DataSource } from '@/types/config';
import SwipeLayerFormContainer from './swipe/SwipeLayerFormContainer';

interface SwipeLayerFormProps {
  availableSources: DataSource[];
  interfaceGroups: string[];
  defaultInterfaceGroup?: string;
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
}

const SwipeLayerForm = (props: SwipeLayerFormProps) => {
  return <SwipeLayerFormContainer {...props} />;
};

export default SwipeLayerForm;
