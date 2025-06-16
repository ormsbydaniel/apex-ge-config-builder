
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SourceFormProps, DataSourceFormat } from '@/types/config';
import { FORMAT_CONFIGS } from '@/constants/formats';
import { useSourceForm } from '@/hooks/useSourceForm';
import { useCategories } from '@/hooks/useCategories';
import { useStatisticsLayer } from '@/hooks/useStatisticsLayer';
import { useValidatedConfig } from '@/hooks/useValidatedConfig';
import FormatSelector from './form/FormatSelector';
import ServiceConfigSection from './form/ServiceConfigSection';
import LayerCardConfigSection from './form/LayerCardConfigSection';

const SourceForm = ({ interfaceGroups, services, onAddSource, onAddService, onCancel }: SourceFormProps) => {
  const { toast } = useToast();
  const { config } = useValidatedConfig();
  
  const {
    selectedFormat,
    formData,
    hasFeatureStatistics,
    setHasFeatureStatistics,
    updateFormData,
    handleFormatChange,
  } = useSourceForm();

  const {
    newCategory,
    setNewCategory,
    showCategories,
    setShowCategories,
    addCategory,
    removeCategory
  } = useCategories(formData, updateFormData);

  // Find current layer statistics if editing an existing layer
  const currentLayer = config.sources.find(source => source.name === formData.name);
  const currentLayerStatistics = currentLayer?.statistics || [];

  const {
    isStatisticsLayer,
    setIsStatisticsLayer,
    statisticsLevel
  } = useStatisticsLayer(currentLayerStatistics);

  // Check if current format supports statistics
  const supportsStatistics = selectedFormat === 'flatgeobuf' || selectedFormat === 'geojson';

  // Enhanced debugging console logs
  console.log('=== SourceForm Debug Info ===');
  console.log('selectedFormat:', selectedFormat);
  console.log('selectedFormat type:', typeof selectedFormat);
  console.log('supportsStatistics:', supportsStatistics);
  console.log('isStatisticsLayer:', isStatisticsLayer);
  console.log('FORMAT_CONFIGS keys:', Object.keys(FORMAT_CONFIGS));
  console.log('formData.data[0]?.format:', formData.data[0]?.format);
  console.log('Component rendered at:', new Date().toISOString());
  console.log('=============================');

  const validateForm = (): string[] => {
    const requiredFields = ['name', 'layout.interfaceGroup'];
    const config = FORMAT_CONFIGS[selectedFormat as DataSourceFormat];
    
    // For service-based configuration, require either serviceId or direct URL
    if (!formData.data[0]?.serviceId && !formData.data[0]?.url?.trim()) {
      requiredFields.push('data.0.url');
    }
    
    if (config.requiresLayers && !formData.data[0]?.layers?.trim()) {
      requiredFields.push('data.0.layers');
    }
    
    return requiredFields.filter(field => {
      const keys = field.split('.');
      let current: any = formData;
      for (const key of keys) {
        current = current[key];
        if (!current || (typeof current === 'string' && !current.trim())) {
          return true;
        }
      }
      return false;
    });
  };

  const handleStatisticsToggle = (checked: boolean) => {
    console.log('Statistics toggle changed to:', checked);
    setIsStatisticsLayer(checked);
  };

  const handleNameChange = (newName: string) => {
    updateFormData('name', newName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = validateForm();

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => {
        if (field === 'data.0.layers') return 'layer';
        if (field === 'data.0.url') return 'service or URL';
        if (field === 'layout.interfaceGroup') return 'interface group';
        return field;
      });
      
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${fieldNames.join(', ')}.`,
        variant: "destructive"
      });
      return;
    }

    const finalFormData = { ...formData };
    if (!showCategories || !finalFormData.meta?.categories?.length) {
      if (finalFormData.meta) {
        delete finalFormData.meta.categories;
      }
    }

    if (hasFeatureStatistics) {
      finalFormData.hasFeatureStatistics = true;
    }

    // Handle statistics layer
    if (isStatisticsLayer && supportsStatistics) {
      // Create statistics item
      const statisticsItem = {
        ...finalFormData.data[0],
        level: statisticsLevel
      };

      // Find existing layer or create new structure
      const existingLayerIndex = config.sources.findIndex(source => source.name === formData.name);
      
      if (existingLayerIndex !== -1) {
        // Add to existing layer's statistics
        const existingLayer = { ...config.sources[existingLayerIndex] };
        if (!existingLayer.statistics) {
          existingLayer.statistics = [];
        }
        existingLayer.statistics.push(statisticsItem);
        
        toast({
          title: "Statistics Layer Added",
          description: `Statistics layer has been added to "${formData.name}".`,
        });
        return;
      } else {
        // Create new layer with statistics
        finalFormData.statistics = [statisticsItem];
        finalFormData.data = []; // Empty data array for statistics-only layer
      }
    } else {
      // Remove layers field for formats that don't use layers
      if (selectedFormat === 'xyz' || selectedFormat === 'cog' || selectedFormat === 'geojson' || selectedFormat === 'flatgeobuf') {
        delete finalFormData.data[0].layers;
      }
    }

    onAddSource(finalFormData);
    toast({
      title: `${selectedFormat.toUpperCase()} Source Added`,
      description: `"${formData.name}" has been added to your configuration.`,
    });
  };

  // Debug render logging
  console.log('About to render statistics section. supportsStatistics:', supportsStatistics);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Data Source</CardTitle>
          <CardDescription>
            Configure a new {selectedFormat.toUpperCase()} layer for your geospatial explorer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormatSelector
              selectedFormat={selectedFormat}
              onFormatChange={handleFormatChange}
            />

            {/* Debug information visible in UI */}
            <div className="p-2 bg-muted/20 border rounded text-xs text-muted-foreground">
              Debug: Format={selectedFormat}, Supports={supportsStatistics ? 'YES' : 'NO'}
            </div>

            {supportsStatistics && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="statisticsLayer"
                    name="statisticsLayer"
                    checked={isStatisticsLayer}
                    onCheckedChange={handleStatisticsToggle}
                  />
                  <Label htmlFor="statisticsLayer" className="font-medium">
                    Statistics Layer
                  </Label>
                </div>
                
                {isStatisticsLayer && (
                  <div className="space-y-2">
                    <Label htmlFor="statisticsLevel">Level (Auto-calculated)</Label>
                    <Input
                      id="statisticsLevel"
                      name="statisticsLevel"
                      type="number"
                      value={statisticsLevel}
                      readOnly
                      className="w-32 bg-muted"
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>
            )}

            <ServiceConfigSection
              formData={formData}
              selectedFormat={selectedFormat}
              services={services}
              onUpdateFormData={updateFormData}
              onAddService={onAddService}
            />

            <LayerCardConfigSection
              formData={formData}
              interfaceGroups={interfaceGroups}
              hasFeatureStatistics={hasFeatureStatistics}
              newCategory={newCategory}
              showCategories={showCategories}
              onUpdateFormData={(field, value) => {
                if (field === 'name') {
                  handleNameChange(value);
                } else {
                  updateFormData(field, value);
                }
              }}
              onSetHasFeatureStatistics={setHasFeatureStatistics}
              onSetNewCategory={setNewCategory}
              onSetShowCategories={setShowCategories}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Add {isStatisticsLayer ? 'Statistics' : selectedFormat.toUpperCase()} Source
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SourceForm;
