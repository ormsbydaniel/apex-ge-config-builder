
import React, { useEffect, useMemo } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, X, Layers, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DataSource } from '@/types/config';
import UnifiedExclusivitySetsSection from '@/components/form/UnifiedExclusivitySetsSection';
import { useLayerCardFormPersistence } from '@/hooks/useLayerCardFormPersistence';
import { useLayerCardFormValidation } from '@/hooks/useLayerCardFormValidation';
import { useLayerCardFormSubmission } from '@/hooks/useLayerCardFormSubmission';
import { useLayerOperations, LayerTypeOption } from '@/hooks/useLayerOperations';
import { analyzeLayerTypeMigration, applyLayerTypeMigration } from '@/utils/layerTypeMigration';
import { useToast } from '@/hooks/use-toast';
import UnifiedBasicInfoSection from '@/components/form/UnifiedBasicInfoSection';
import UnifiedAttributionSection from '@/components/form/UnifiedAttributionSection';
import UnifiedCategoriesSection from '@/components/form/UnifiedCategoriesSection';
import UnifiedLegendTypeSection from '@/components/form/UnifiedLegendTypeSection';
import UnifiedControlsSection from '@/components/form/UnifiedControlsSection';
import UnifiedTimePeriodSection from '@/components/form/UnifiedTimePeriodSection';
import LayerTypeRadioGroup from '@/components/form/LayerTypeRadioGroup';
import PositionEditor from '@/components/form/PositionEditor';
import ColormapsSection from '@/components/form/ColormapsSection';
import ContentLocationRadioGroup from '@/components/form/ContentLocationRadioGroup';
import FieldsSection from '@/components/form/FieldsSection';
import { isVectorFormat } from '@/utils/fieldDetection';

interface LayerCardFormProps {
  interfaceGroups: string[];
  availableExclusivitySets?: string[];
  defaultInterfaceGroup?: string;
  defaultSubinterfaceGroup?: string;
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
}

const LayerCardForm = ({ 
  interfaceGroups, 
  availableExclusivitySets = [],
  defaultInterfaceGroup,
  defaultSubinterfaceGroup,
  onAddLayer, 
  onCancel, 
  editingLayer, 
  isEditing = false 
}: LayerCardFormProps) => {
  const { config, dispatch } = useConfig();
  const { toast } = useToast();
  const {
    formData,
    updateFormData,
    clearDraft,
    isDirty,
    isAutoSaving
  } = useLayerCardFormPersistence(editingLayer, isEditing, defaultInterfaceGroup, defaultSubinterfaceGroup);

  const { validateForm } = useLayerCardFormValidation();
  const { createLayerFromFormData, handleSuccessfulSubmission } = useLayerCardFormSubmission(editingLayer, isEditing);

  // Use consolidated layer operations for layer type and position management
  const layerOperations = useLayerOperations({
    config: { sources: [] },
    dispatch: () => {},
    initialLayer: editingLayer,
    dataSources: editingLayer?.data || [],
    onDataSourcesChange: (updatedDataSources) => {
      
    },
    onLayerTypeChange: (newType) => {
      // Handle layer type migration
      if (editingLayer && editingLayer.data?.length > 0) {
        const migration = analyzeLayerTypeMigration(editingLayer, newType);
        if (migration.warningMessage) {
          // Show migration warning if needed
        }
        if (migration.needsPositionAssignment) {
          // Positions will be handled by the position management hook
          layerOperations.ensureDataSourcesHavePositions();
        }
      }
    }
  });

  const {
    selectedLayerTypeOption: selectedLayerType,
    handleLayerTypeChange,
    getLayerTypeFlags,
    isComparisonLayerType,
    isPositionModalOpen,
    editingDataSourceIndex,
    updateDataSourcePosition,
    openPositionEditor,
    closePositionEditor,
    ensureDataSourcesHavePositions
  } = layerOperations;

  // Add colormap management - create a temp layerCard object for useColormaps
  const layerCardData = {
    name: formData.name,
    isActive: formData.isActive,
    data: [],
    meta: {
      description: formData.description,
      attribution: {
        text: formData.attributionText,
        url: formData.attributionUrl
      },
      categories: formData.categories,
      colormaps: formData.colormaps || []
    }
  } as DataSource;

  // Notify ConfigContext when form editing state changes
  useEffect(() => {
    if (isDirty && formData.name) {
      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: true, description: `Layer: ${formData.name}` }
      });
    }
  }, [isDirty, formData.name, dispatch]);

  // Get data sources for position management
  const dataSources = editingLayer?.data || [];

  // Compute available sub-groups based on selected interface group
  const availableSubinterfaceGroups = useMemo(() => {
    const subGroups = new Set<string>();
    config.sources.forEach(source => {
      if (source.layout?.interfaceGroup === formData.interfaceGroup &&
          source.layout?.subinterfaceGroup) {
        subGroups.add(source.layout.subinterfaceGroup);
      }
    });
    return Array.from(subGroups);
  }, [config.sources, formData.interfaceGroup]);

  // Wrapper for updateFormData that handles auto-switch logic
  const handleFieldChange = (field: string, value: any) => {
    updateFormData(field, value);
    
    // Clear sub-interface group when interface group changes
    if (field === 'interfaceGroup') {
      updateFormData('subinterfaceGroup', '');
    }
    
    // Auto-switch to gradient when colormap is added
    if (field === 'colormaps' && Array.isArray(value) && value.length > 0) {
      if (formData.legendType !== 'gradient') {
        updateFormData('legendType', 'gradient');
        toast({
          title: "Legend type changed",
          description: "Legend type automatically switched to gradient",
        });
      }
    }
  };

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
      zoomToCenter: (formData as any).zoomToCenter || false,
      download: (formData as any).download,
      temporalControls: (formData as any).temporalControls || false,
      constraintSlider: (formData as any).constraintSlider || false,
      blendControls: (formData as any).blendControls || false,
      categories: processedCategories || [],
      colormaps: formData.colormaps || [],
      timeframe: formData.timeframe,
      defaultTimestamp: formData.defaultTimestamp,
      fields: formData.fields || {}
    });

    // Apply layer type flags
    const layerTypeFlags = getLayerTypeFlags(selectedLayerType);
    layerCard = { ...layerCard, ...layerTypeFlags };

    // Apply full migration if editing
    if (isEditing && editingLayer) {
      layerCard = applyLayerTypeMigration(layerCard, selectedLayerType);
    }

    // Clear unsaved changes flag
    dispatch({
      type: 'SET_UNSAVED_FORM_CHANGES',
      payload: { hasChanges: false, description: null }
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
    
    // Clear unsaved changes flag
    dispatch({
      type: 'SET_UNSAVED_FORM_CHANGES',
      payload: { hasChanges: false, description: null }
    });

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

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <LayerTypeRadioGroup
                  value={selectedLayerType}
                  onChange={handleLayerTypeChange}
                />
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center justify-between space-x-2 min-w-[140px]">
                    <Label htmlFor="toggleable" className="min-w-[70px]">Toggleable:</Label>
                    <Switch
                      id="toggleable"
                      checked={formData.toggleable}
                      onCheckedChange={(checked) => handleFieldChange('toggleable', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2 min-w-[160px]">
                    <Label htmlFor="isActive">Active by default:</Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                    />
                  </div>
                </div>
              </div>

              <ContentLocationRadioGroup
                value={formData.contentLocation}
                onChange={(value) => handleFieldChange('contentLocation', value)}
              />
            </div>

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
              subinterfaceGroup={formData.subinterfaceGroup}
              availableSubinterfaceGroups={availableSubinterfaceGroups}
              showSubinterfaceGroup={true}
              units={formData.units}
              timeframe={formData.timeframe}
              defaultTimestamp={formData.defaultTimestamp}
              onUpdate={handleFieldChange}
              showUnits={true}
            />

            <UnifiedAttributionSection
              attributionText={formData.attributionText}
              attributionUrl={formData.attributionUrl}
              onUpdate={handleFieldChange}
            />

            <UnifiedCategoriesSection
              categories={processedCategories || []}
              onUpdate={handleFieldChange}
              layerName={formData.name || ''}
            />

            <ColormapsSection
              colormaps={formData.colormaps || []}
              onUpdate={handleFieldChange}
              metaMin={formData.minValue ? parseFloat(formData.minValue) : undefined}
              metaMax={formData.maxValue ? parseFloat(formData.maxValue) : undefined}
            />

            {/* Fields section - show for all layers, auto-detect works for vector formats */}
            <FieldsSection
              fields={formData.fields || {}}
              onUpdate={handleFieldChange}
              sourceUrl={editingLayer?.data?.[0]?.url}
              sourceFormat={editingLayer?.data?.[0]?.format}
            />

            <UnifiedLegendTypeSection
              legendType={formData.legendType}
              legendUrl={formData.legendUrl}
              startColor={formData.startColor}
              endColor={formData.endColor}
              minValue={formData.minValue}
              maxValue={formData.maxValue}
              colormaps={formData.colormaps || []}
              onUpdate={handleFieldChange}
            />

            <UnifiedControlsSection
              opacitySlider={formData.opacitySlider}
              zoomToCenter={(formData as any).zoomToCenter || false}
              download={(formData as any).download}
              temporalControls={(formData as any).temporalControls || false}
              constraintSlider={(formData as any).constraintSlider || false}
              blendControls={(formData as any).blendControls || false}
              timeframe={formData.timeframe || 'None'}
              onUpdate={handleFieldChange}
            />

            {availableExclusivitySets.length > 0 && (
              <UnifiedExclusivitySetsSection
                availableExclusivitySets={availableExclusivitySets}
                selectedExclusivitySets={formData.exclusivitySets}
                onUpdateExclusivitySets={(exclusivitySets) => handleFieldChange('exclusivitySets', exclusivitySets)}
              />
            )}


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
