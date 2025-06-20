
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, X, Layers, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataSource } from '@/types/config';
import { useLayerCardFormPersistence } from '@/hooks/useLayerCardFormPersistence';
import { useLayerCardFormValidation } from '@/hooks/useLayerCardFormValidation';
import { useLayerCardFormSubmission } from '@/hooks/useLayerCardFormSubmission';
import { useLayerTypeManagement } from '@/hooks/useLayerTypeManagement';
import { usePositionManagement } from '@/hooks/usePositionManagement';
import { analyzeLayerTypeMigration, applyLayerTypeMigration } from '@/utils/layerTypeMigration';
import UnifiedBasicInfoSection from '@/components/form/UnifiedBasicInfoSection';
import UnifiedAttributionSection from '@/components/form/UnifiedAttributionSection';
import UnifiedLegendSection from '@/components/form/UnifiedLegendSection';
import LayerTypeRadioGroup from '@/components/form/LayerTypeRadioGroup';
import PositionEditor from '@/components/form/PositionEditor';

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

  const {
    selectedLayerType,
    handleLayerTypeChange,
    getLayerTypeFlags,
    isComparisonLayerType
  } = useLayerTypeManagement({
    initialLayer: editingLayer,
    onLayerTypeChange: (newType) => {
      // Handle layer type migration
      if (editingLayer && editingLayer.data?.length > 0) {
        const migration = analyzeLayerTypeMigration(editingLayer, newType);
        if (migration.warningMessage) {
          console.log('Migration warning:', migration.warningMessage);
        }
        if (migration.needsPositionAssignment) {
          // Positions will be handled by the position management hook
          ensureDataSourcesHavePositions();
        }
      }
    }
  });

  // Mock data sources for position management (in real implementation, this would come from form data)
  const dataSources = editingLayer?.data || [];
  
  const {
    isPositionModalOpen,
    editingDataSourceIndex,
    updateDataSourcePosition,
    openPositionEditor,
    closePositionEditor,
    ensureDataSourcesHavePositions
  } = usePositionManagement({
    layerType: selectedLayerType,
    dataSources,
    onDataSourcesChange: (updatedDataSources) => {
      // In real implementation, update the form data with new data sources
      console.log('Data sources updated:', updatedDataSources);
    }
  });

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

    // Create layer with layer type flags
    let layerCard = createLayerFromFormData({
      ...formData,
      categories: processedCategories || []
    });

    // Apply layer type flags
    const layerTypeFlags = getLayerTypeFlags(selectedLayerType);
    layerCard = { ...layerCard, ...layerTypeFlags };

    // Apply full migration if editing
    if (isEditing && editingLayer) {
      layerCard = applyLayerTypeMigration(layerCard, selectedLayerType);
    }

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

  // Show warning for comparison layers with existing data
  const showMigrationWarning = isEditing && editingLayer?.data?.length > 0 && isComparisonLayerType(selectedLayerType);

  return (
    <>
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
            <LayerTypeRadioGroup
              value={selectedLayerType}
              onChange={handleLayerTypeChange}
            />

            {showMigrationWarning && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Changing to {selectedLayerType} layer will require position settings for existing data sources.
                  You can set these after saving the layer.
                </AlertDescription>
              </Alert>
            )}

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
              layerName={formData.name || ''}
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

      <PositionEditor
        isOpen={isPositionModalOpen}
        onClose={closePositionEditor}
        layerType={selectedLayerType}
        currentPosition={editingDataSourceIndex !== null ? (dataSources[editingDataSourceIndex] as any)?.position : undefined}
        onSave={(position) => {
          if (editingDataSourceIndex !== null) {
            updateDataSourcePosition(editingDataSourceIndex, position);
          }
        }}
        dataSourceName={editingDataSourceIndex !== null ? `Data Source ${editingDataSourceIndex + 1}` : undefined}
      />
    </>
  );
};

export default LayerCardForm;
