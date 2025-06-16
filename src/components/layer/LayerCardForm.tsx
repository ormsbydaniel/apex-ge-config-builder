
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, X, Layers } from 'lucide-react';
import { DataSource } from '@/types/config';
import { useLayerCardFormPersistence } from '@/hooks/useLayerCardFormPersistence';
import { useLayerCardFormValidation } from '@/hooks/useLayerCardFormValidation';
import { useLayerCardFormSubmission } from '@/hooks/useLayerCardFormSubmission';
import UnifiedBasicInfoSection from '@/components/form/UnifiedBasicInfoSection';
import UnifiedAttributionSection from '@/components/form/UnifiedAttributionSection';
import UnifiedLegendSection from '@/components/form/UnifiedLegendSection';

interface LayerCardFormProps {
  interfaceGroups: string[];
  defaultInterfaceGroup?: string;
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
}

const LayerCardForm = ({ 
  interfaceGroups, 
  defaultInterfaceGroup, 
  onAddLayer, 
  onCancel, 
  editingLayer, 
  isEditing = false 
}: LayerCardFormProps) => {
  const {
    formData,
    updateFormData,
    clearDraft,
    isDirty,
    isAutoSaving
  } = useLayerCardFormPersistence(editingLayer, isEditing, defaultInterfaceGroup);

  const { validateForm } = useLayerCardFormValidation();
  const { createLayerFromFormData, handleSuccessfulSubmission } = useLayerCardFormSubmission(editingLayer, isEditing);

  // Process categories to ensure they have the required value property
  const processedCategories = formData.categories?.map((cat, index) => ({
    label: cat.label || '',
    color: cat.color || '#000000',
    value: (cat as any).value ?? index
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    const layerCard = createLayerFromFormData({
      ...formData,
      categories: processedCategories || []
    });

    onAddLayer(layerCard);
    clearDraft();
    handleSuccessfulSubmission(formData.name);
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmDiscard) return;
    }
    clearDraft();
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          {isEditing ? 'Edit Layer Card' : 'Create Layer Card'}
          {isDirty && <span className="text-sm text-orange-600">(Unsaved changes)</span>}
          {isAutoSaving && <span className="text-sm text-blue-600">(Auto-saving...)</span>}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update the layer card properties.'
            : 'Configure the layer card properties before adding data sources.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <UnifiedBasicInfoSection
            name={formData.name}
            description={formData.description}
            interfaceGroup={formData.interfaceGroup}
            interfaceGroups={interfaceGroups}
            hasFeatureStatistics={formData.hasFeatureStatistics}
            units={formData.units}
            isActive={(formData as any).isActive || false}
            onUpdate={updateFormData}
            showFeatureStatistics={true}
            showUnits={true}
            showIsActive={true}
          />

          <UnifiedAttributionSection
            attributionText={formData.attributionText}
            attributionUrl={formData.attributionUrl}
            onUpdate={updateFormData}
          />

          <UnifiedLegendSection
            toggleable={formData.toggleable}
            opacitySlider={formData.opacitySlider}
            legendType={formData.legendType}
            legendUrl={formData.legendUrl}
            startColor={formData.startColor}
            endColor={formData.endColor}
            minValue={formData.minValue}
            maxValue={formData.maxValue}
            categories={processedCategories || []}
            onUpdate={updateFormData}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Create Layer Card'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LayerCardForm;
