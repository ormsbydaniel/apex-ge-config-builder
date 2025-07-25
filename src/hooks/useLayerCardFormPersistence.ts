
import { useState, useEffect, useCallback } from 'react';
import { DataSource, Category, TimeframeType } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface LayerCardFormData {
  name: string;
  description: string;
  interfaceGroup: string;
  attributionText: string;
  attributionUrl: string;
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
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
  timeframe: TimeframeType;
  defaultTimestamp?: number;
}

const STORAGE_KEY = 'layer-card-form-draft';
const AUTO_SAVE_DELAY = 1000; // 1 second

export const useLayerCardFormPersistence = (
  editingLayer?: DataSource,
  isEditing: boolean = false,
  defaultInterfaceGroup?: string
) => {
  const { toast } = useToast();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const getInitialFormData = (): LayerCardFormData => {
    if (isEditing && editingLayer) {
      return {
        name: editingLayer.name || '',
        description: editingLayer.meta?.description || '',
        interfaceGroup: editingLayer.layout?.interfaceGroup || defaultInterfaceGroup || '',
        attributionText: editingLayer.meta?.attribution?.text || '',
        attributionUrl: editingLayer.meta?.attribution?.url || '',
        toggleable: editingLayer.layout?.layerCard?.toggleable || false,
        opacitySlider: editingLayer.layout?.layerCard?.controls?.opacitySlider || false,
        zoomToCenter: (editingLayer.layout?.layerCard?.controls as any)?.zoomToCenter || false,
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
        timeframe: editingLayer.meta?.timeframe || 'None',
        defaultTimestamp: editingLayer.meta?.defaultTimestamp
      };
    }

    // For new layers, try to load from localStorage first
    if (!isEditing) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            interfaceGroup: parsed.interfaceGroup || defaultInterfaceGroup || ''
          };
        }
      } catch (error) {
        console.warn('Failed to load draft from localStorage:', error);
      }
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
      timeframe: 'None'
    };
  };

  const [formData, setFormData] = useState<LayerCardFormData>(getInitialFormData);

  // Auto-save to localStorage for new layers only
  useEffect(() => {
    if (!isEditing && isDirty) {
      const timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        } catch (error) {
          console.warn('Failed to save draft to localStorage:', error);
        }
        setTimeout(() => setIsAutoSaving(false), 500);
      }, AUTO_SAVE_DELAY);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, isDirty, isEditing]);

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

  const clearDraft = useCallback(() => {
    if (!isEditing) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to clear draft from localStorage:', error);
      }
    }
    setIsDirty(false);
  }, [isEditing]);

  return {
    formData,
    updateFormData,
    clearDraft,
    isDirty,
    isAutoSaving
  };
};
