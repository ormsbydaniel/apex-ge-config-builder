import { useState, useEffect, useCallback, useRef } from 'react';
import { DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { convertCategoriesToHex } from '@/utils/colorUtils';

interface FormData {
  name: string;
  description: string;
  interfaceGroup: string;
  attributionText: string;
  attributionUrl: string;
  hasFeatureStatistics: boolean;
  units: string;
  toggleable: boolean;
  opacitySlider: boolean;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  categories: Array<{ label: string; color: string }>;
}

const STORAGE_KEY_PREFIX = 'layer-form-draft-';
const AUTO_SAVE_DELAY = 2000;

export const useLayerCardFormPersistence = (
  editingLayer?: DataSource,
  isEditing: boolean = false,
  defaultInterfaceGroup?: string
) => {
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const getStorageKey = () => {
    return `${STORAGE_KEY_PREFIX}${editingLayer?.name || 'new'}`;
  };

  const getInitialFormData = (): FormData => {
    if (isEditing && editingLayer) {
      // Convert categories to hex format if they exist
      const convertedCategories = editingLayer.meta?.categories 
        ? convertCategoriesToHex(editingLayer.meta.categories)
        : [];

      return {
        name: editingLayer.name,
        description: editingLayer.meta?.description || '',
        interfaceGroup: editingLayer.layout?.interfaceGroup || '',
        attributionText: editingLayer.meta?.attribution?.text || '',
        attributionUrl: editingLayer.meta?.attribution?.url || '',
        hasFeatureStatistics: editingLayer.hasFeatureStatistics || false,
        units: editingLayer.meta?.units || '',
        toggleable: editingLayer.layout?.layerCard?.toggleable ?? true,
        opacitySlider: editingLayer.layout?.layerCard?.controls?.opacitySlider ?? true,
        legendType: editingLayer.layout?.layerCard?.legend?.type || 'swatch',
        legendUrl: editingLayer.layout?.layerCard?.legend?.url || '',
        startColor: editingLayer.meta?.startColor || '#000000',
        endColor: editingLayer.meta?.endColor || '#ffffff',
        minValue: editingLayer.meta?.min !== undefined ? editingLayer.meta.min.toString() : '',
        maxValue: editingLayer.meta?.max !== undefined ? editingLayer.meta.max.toString() : '',
        categories: convertedCategories
      };
    }

    // Check for saved draft
    const savedDraft = sessionStorage.getItem(getStorageKey());
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (error) {
        console.warn('Failed to parse saved form data:', error);
      }
    }

    return {
      name: '',
      description: '',
      interfaceGroup: defaultInterfaceGroup || '',
      attributionText: '',
      attributionUrl: '',
      hasFeatureStatistics: false,
      units: '',
      toggleable: true,
      opacitySlider: true,
      legendType: 'swatch' as const,
      legendUrl: '',
      startColor: '#000000',
      endColor: '#ffffff',
      minValue: '',
      maxValue: '',
      categories: []
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);

  const saveDraft = useCallback((data: FormData) => {
    try {
      sessionStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save form draft:', error);
    }
  }, [getStorageKey]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(getStorageKey());
      setIsDirty(false);
    } catch (error) {
      console.warn('Failed to clear form draft:', error);
    }
  }, [getStorageKey]);

  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      setIsDirty(true);

      // Debounced auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        setIsAutoSaving(true);
        saveDraft(updated);
        setTimeout(() => setIsAutoSaving(false), 500);
      }, AUTO_SAVE_DELAY);

      return updated;
    });
  }, [saveDraft]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    clearDraft();
  }, [clearDraft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    formData,
    updateFormData,
    resetForm,
    clearDraft,
    isDirty,
    isAutoSaving
  };
};
