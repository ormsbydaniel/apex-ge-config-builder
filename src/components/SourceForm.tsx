
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SourceFormProps, DataSourceFormat, SourceConfigType } from '@/types/config';
import { FORMAT_CONFIGS } from '@/constants/formats';
import { useSourceForm } from '@/hooks/useSourceForm';
import { useCategories } from '@/hooks/useCategories';
import { useStatisticsLayer } from '@/hooks/useStatisticsLayer';
import { useValidatedConfig } from '@/hooks/useValidatedConfig';
import { validateS3Url, S3Selection, getFormatFromExtension } from '@/utils/s3Utils';
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

  // Debug logging for SourceForm
  console.log('SourceForm Debug:', {
    selectedFormat,
    formDataServiceId: formData.data[0]?.serviceId,
    formDataUrl: formData.data[0]?.url,
    services: services.map(s => ({ id: s.id, name: s.name, format: s.format, sourceType: s.sourceType }))
  });

  const [selectedS3Object, setSelectedS3Object] = useState<S3Selection | null>(null);
  const [detectedS3Format, setDetectedS3Format] = useState<DataSourceFormat | null>(null);

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
  const effectiveFormat = detectedS3Format || (selectedFormat === 's3' ? null : selectedFormat as DataSourceFormat);
  const supportsStatistics = effectiveFormat === 'flatgeobuf' || effectiveFormat === 'geojson';


  const handleS3ObjectSelect = (selection: S3Selection | S3Selection[]) => {
    // Handle single selection (bulk handling happens in parent components)
    if (Array.isArray(selection)) {
      // For SourceForm, we only handle single selections
      // Bulk operations are handled by DataSourceForm
      if (selection.length > 0) {
        const first = selection[0];
        setSelectedS3Object(first);
        setDetectedS3Format(first.format);
        updateFormData('data.0.url', first.url);
        updateFormData('data.0.format', first.format);
      }
    } else {
      setSelectedS3Object(selection);
      setDetectedS3Format(selection.format);
      updateFormData('data.0.url', selection.url);
      updateFormData('data.0.format', selection.format);
      
      toast({
        title: "S3 Object Selected",
        description: `Selected ${selection.key} (detected as ${selection.format.toUpperCase()})`,
      });
    }
  };

  const validateForm = (): string[] => {
    const requiredFields = ['name', 'layout.interfaceGroup'];
    
    if (selectedFormat === 's3') {
      // For S3, we need the bucket URL and selected object
      if (!formData.data[0]?.url?.trim()) {
        requiredFields.push('S3 bucket URL');
      } else if (!validateS3Url(formData.data[0].url) && !selectedS3Object) {
        requiredFields.push('Valid S3 bucket URL or selected object');
      }
    } else {
      const config = FORMAT_CONFIGS[selectedFormat as DataSourceFormat];
      
      // For service-based configuration, require either serviceId or direct URL
      if (!formData.data[0]?.serviceId && !formData.data[0]?.url?.trim()) {
        requiredFields.push('data.0.url');
      }
      
      if (config.requiresLayers && !formData.data[0]?.layers?.trim()) {
        requiredFields.push('data.0.layers');
      }
    }
    
    return requiredFields.filter(field => {
      if (field.includes('.')) {
        const keys = field.split('.');
        let current: any = formData;
        for (const key of keys) {
          current = current[key];
          if (!current || (typeof current === 'string' && !current.trim())) {
            return true;
          }
        }
        return false;
      }
      return true; // Custom validation messages
    });
  };

  const handleStatisticsToggle = (checked: boolean) => {
    
    setIsStatisticsLayer(checked);
  };

  const handleNameChange = (newName: string) => {
    updateFormData('name', newName);
  };

  // Parse level from filename (e.g., "level00" -> 0, "level01" -> 1)
  const parseLevelFromFilename = (url: string): number | undefined => {
    const filename = url.split('/').pop() || '';
    const levelMatch = filename.match(/level(\d+)/i);
    if (levelMatch) {
      return parseInt(levelMatch[1], 10);
    }
    return undefined;
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
      // Parse level from filename or use calculated level
      const url = finalFormData.data[0]?.url || '';
      const parsedLevel = parseLevelFromFilename(url);
      const level = parsedLevel !== undefined ? parsedLevel : statisticsLevel;

      // Create statistics item
      const statisticsItem = {
        ...finalFormData.data[0],
        level
      };

      // Find existing layer to add statistics to
      const existingLayerIndex = config.sources.findIndex(source => source.name === formData.name);
      
      if (existingLayerIndex !== -1) {
        // Update existing layer by adding to statistics array
        const updatedLayer = { ...config.sources[existingLayerIndex] };
        if (!updatedLayer.statistics) {
          updatedLayer.statistics = [];
        }
        updatedLayer.statistics.push(statisticsItem);
        
        // Pass the updated layer back through onAddSource (which handles updates)
        onAddSource(updatedLayer);
        
        toast({
          title: "Statistics Layer Added",
          description: `Statistics layer (level ${level}) has been added to "${formData.name}".`,
        });
        return;
      } else {
        // Create new layer with statistics
        finalFormData.statistics = [statisticsItem];
        finalFormData.data = []; // Empty data array for statistics-only layer
      }
    } else {
      // Remove layers field for formats that don't use layers
      const actualFormat = detectedS3Format || selectedFormat;
      if (actualFormat === 'xyz' || actualFormat === 'cog' || actualFormat === 'geojson' || actualFormat === 'flatgeobuf' || selectedFormat === 's3') {
        delete finalFormData.data[0].layers;
      }
    }

    onAddSource(finalFormData);
    toast({
      title: `${(detectedS3Format || selectedFormat).toString().toUpperCase()} Source Added`,
      description: `"${formData.name}" has been added to your configuration.`,
    });
  };

  // Determine the effective format for rendering (S3 object's detected format or selected format)
  const displayFormat = detectedS3Format || selectedFormat;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Data Source</CardTitle>
          <CardDescription>
            Configure a new {displayFormat.toString().toUpperCase()} layer for your geospatial explorer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormatSelector
              selectedFormat={selectedFormat}
              onFormatChange={handleFormatChange}
            />

            {/* Show detected format info for S3 */}
            {selectedS3Object && detectedS3Format && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="font-medium">Selected:</span>
                  <span>{selectedS3Object.key}</span>
                  <span className="text-sm">({detectedS3Format.toUpperCase()})</span>
                </div>
              </div>
            )}

            {/* Statistics section for supported formats */}
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
              onObjectSelect={handleS3ObjectSelect}
            />

            {/* Only show layer card config if we have a valid configuration */}
            {(selectedFormat !== 's3' || (selectedFormat === 's3' && detectedS3Format)) && (
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
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Add {isStatisticsLayer ? 'Statistics' : displayFormat.toString().toUpperCase()} Source
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SourceForm;
