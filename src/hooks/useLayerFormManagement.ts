
import { useState, useCallback } from 'react';
import { DataSource, LayerType } from '@/types/config';
import { useFormComposition } from './useFormComposition';

interface UseLayerFormManagementProps {
  onLayerSaved?: (layer: DataSource) => void;
  onLayerCanceled?: () => void;
  editingLayer?: DataSource;
}

export const useLayerFormManagement = ({
  onLayerSaved,
  onLayerCanceled,
  editingLayer
}: UseLayerFormManagementProps = {}) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<LayerType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const initialData = editingLayer || {
    name: '',
    description: '',
    layout: {
      interfaceGroup: ''
    },
    meta: {
      attribution: {
        text: '',
        url: ''
      }
    }
  };

  const formComposition = useFormComposition({
    initialData,
    fields: [
      { name: 'name', required: true },
      { name: 'description', required: false },
      { name: 'layout.interfaceGroup', required: true },
      { name: 'meta.attribution.text', required: true },
      { name: 'meta.attribution.url', required: false }
    ],
    onSubmit: (data) => {
      onLayerSaved?.(data as DataSource);
      handleCloseForm();
    }
  });

  const handleOpenForm = useCallback((type: LayerType, layer?: DataSource) => {
    setSelectedType(type);
    setIsEditing(!!layer);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedType(null);
    setIsEditing(false);
    formComposition.resetForm();
    onLayerCanceled?.();
  }, [formComposition, onLayerCanceled]);

  const handleTypeSelect = useCallback((type: LayerType) => {
    setSelectedType(type);
  }, []);

  return {
    showForm,
    selectedType,
    isEditing,
    formData: formComposition.formData,
    errors: formComposition.errors,
    isDirty: formComposition.isDirty,
    updateField: formComposition.updateField,
    handleSubmit: formComposition.handleSubmit,
    handleOpenForm,
    handleCloseForm,
    handleTypeSelect,
    validateForm: formComposition.validateForm
  };
};
