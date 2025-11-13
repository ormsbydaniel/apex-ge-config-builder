
import { useState, useCallback } from 'react';
import { DataSource, Category, TimeframeType } from '@/types/config';
import { LayerTypeOption } from '@/hooks/useLayerOperations';

interface LayerCardFormData {
  name: string;
  description: string;
  interfaceGroup: string;
  attributionText: string;
  attributionUrl: string;
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
  download?: string;
  temporalControls: boolean;
  constraintSlider: boolean;
  blendControls: boolean;
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
  timeframe: TimeframeType;
  defaultTimestamp?: number;
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

      // Check both layerCard and infoPanel for controls (backward compatibility)
      const controls = editingLayer.layout?.layerCard?.controls || editingLayer.layout?.infoPanel?.controls;
      const controlsObj = controls && typeof controls === 'object' && !Array.isArray(controls) ? controls : undefined;

      return {
        name: editingLayer.name || '',
        description: editingLayer.meta?.description || '',
        interfaceGroup: editingLayer.layout?.interfaceGroup || defaultInterfaceGroup || '',
        attributionText: editingLayer.meta?.attribution?.text || '',
        attributionUrl: editingLayer.meta?.attribution?.url || '',
        toggleable: editingLayer.layout?.layerCard?.toggleable || false,
        opacitySlider: controlsObj?.opacitySlider || false,
        zoomToCenter: controlsObj?.zoomToCenter || false,
        download: controlsObj?.download,
        temporalControls: controlsObj?.temporalControls || false,
        constraintSlider: controlsObj?.constraintSlider || false,
        blendControls: controlsObj?.blendControls || false,
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
        layerType,
        timeframe: editingLayer.timeframe || 'None',
        defaultTimestamp: editingLayer.defaultTimestamp
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
      zoomToCenter: false,
      download: undefined,
      temporalControls: false,
      constraintSlider: false,
      blendControls: false,
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
      layerType: 'standard',
      timeframe: 'None'
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
