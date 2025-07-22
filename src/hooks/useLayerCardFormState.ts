
import { useState, useCallback } from 'react';
import { DataSource, Category } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerOperations';

interface LayerCardFormData {
  name: string;
  description: string;
  interfaceGroup: string;
  attributionText: string;
  attributionUrl: string;
  toggleable: boolean;
  opacitySlider: boolean;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  categories: Category[];
  units: string;
  hasFeatureStatistics: boolean;
  isActive: boolean;
  layerType: LayerTypeOption;
}

interface UseLayerCardFormStateProps {
  editingLayer?: DataSource;
  isEditing?: boolean;
  defaultInterfaceGroup?: string;
}

export const useLayerCardFormState = ({
  editingLayer,
  isEditing = false,
  defaultInterfaceGroup
}: UseLayerCardFormStateProps = {}) => {
  const getInitialFormData = (): LayerCardFormData => {
    if (isEditing && editingLayer) {
      // Extract layer type from existing layer
      let layerType: LayerTypeOption = 'standard';
      if ((editingLayer as any).isSwipeLayer) layerType = 'swipe';
      if ((editingLayer as any).isMirrorLayer) layerType = 'mirror';
      if ((editingLayer as any).isSpotlightLayer) layerType = 'spotlight';

      return {
        name: editingLayer.name || '',
        description: editingLayer.meta?.description || '',
        interfaceGroup: editingLayer.layout?.interfaceGroup || defaultInterfaceGroup || '',
        attributionText: editingLayer.meta?.attribution?.text || '',
        attributionUrl: editingLayer.meta?.attribution?.url || '',
        toggleable: editingLayer.layout?.layerCard?.toggleable || false,
        opacitySlider: editingLayer.layout?.layerCard?.controls?.opacitySlider || false,
        legendType: editingLayer.layout?.layerCard?.legend?.type || 'swatch',
        legendUrl: editingLayer.layout?.layerCard?.legend?.url || '',
        startColor: editingLayer.meta?.startColor || '#000000',
        endColor: editingLayer.meta?.endColor || '#ffffff',
        minValue: editingLayer.meta?.min?.toString() || '',
        maxValue: editingLayer.meta?.max?.toString() || '',
        categories: editingLayer.meta?.categories || [],
        units: editingLayer.meta?.units || '',
        hasFeatureStatistics: editingLayer.hasFeatureStatistics || false,
        isActive: editingLayer.isActive || false,
        layerType
      };
    }

    return {
      name: '',
      description: '',
      interfaceGroup: defaultInterfaceGroup || '',
      attributionText: '',
      attributionUrl: '',
      toggleable: false,
      opacitySlider: false,
      legendType: 'swatch',
      legendUrl: '',
      startColor: '#000000',
      endColor: '#ffffff',
      minValue: '',
      maxValue: '',
      categories: [],
      units: '',
      hasFeatureStatistics: false,
      isActive: false,
      layerType: 'standard'
    };
  };

  const [formData, setFormData] = useState<LayerCardFormData>(getInitialFormData());
  const [isDirty, setIsDirty] = useState(false);

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setIsDirty(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setIsDirty(false);
  }, []);

  return {
    formData,
    isDirty,
    updateFormData,
    resetForm
  };
};
