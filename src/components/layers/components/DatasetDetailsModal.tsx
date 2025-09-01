import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Database, Globe, Server, FileText, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSourceForm } from '@/hooks/useSourceForm';
import { useStatisticsLayer } from '@/hooks/useStatisticsLayer';
import { DataSourceFormat, SourceConfigType, Service, DataSource, DataSourceItem, Category } from '@/types/config';
import ServiceConfigSection from '@/components/form/ServiceConfigSection';
import LayerCardConfigSection from '@/components/form/LayerCardConfigSection';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { validateS3Url, S3Object } from '@/utils/s3Utils';

interface DatasetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDataSource: (dataSource: DataSourceItem) => void;
  onAddStatisticsLayer: (statisticsItem: DataSourceItem) => void;
  services: Service[];
  onAddService?: (service: Service) => void;
  // Pre-filled data from wizard steps
  initialFormat?: DataSourceFormat;
  initialUrl?: string;
  initialLayers?: string;
  selectedService?: Service | null;
  selectedS3Object?: S3Object | null;
}

export const DatasetDetailsModal = ({ 
  isOpen, 
  onClose, 
  onAddDataSource,
  onAddStatisticsLayer,
  services, 
  onAddService,
  initialFormat,
  initialUrl,
  initialLayers,
  selectedService,
  selectedS3Object
}: DatasetDetailsModalProps) => {
  const { toast } = useToast();
  const { 
    selectedFormat,
    formData,
    hasFeatureStatistics,
    setHasFeatureStatistics,
    updateFormData,
    handleFormatChange,
    resetForm 
  } = useSourceForm();
  
  const {
    isStatisticsLayer,
    setIsStatisticsLayer,
    statisticsLevel,
    getNextLevel
  } = useStatisticsLayer();

  // Category management state
  const [newCategory, setNewCategory] = useState<Category>({ color: '', label: '', value: 0 });
  const [showCategories, setShowCategories] = useState(false);

  // Add category function
  const handleAddCategory = () => {
    const categories = formData.meta?.categories || [];
    const updatedCategories = [...categories, newCategory];
    updateFormData('meta.categories', updatedCategories);
    setNewCategory({ color: '', label: '', value: 0 });
  };

  // Remove category function
  const handleRemoveCategory = (index: number) => {
    const categories = formData.meta?.categories || [];
    const updatedCategories = categories.filter((_, i) => i !== index);
    updateFormData('meta.categories', updatedCategories);
  };

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && initialFormat) {
      handleFormatChange(initialFormat as SourceConfigType);
      if (initialUrl) {
        updateFormData('data.0.url', initialUrl);
      }
      if (initialLayers) {
        updateFormData('data.0.layers', initialLayers);
      }
      if (selectedS3Object) {
        updateFormData('data.0.url', selectedS3Object.url);
        updateFormData('name', selectedS3Object.key.split('/').pop() || 'S3 Dataset');
      }
    }
  }, [isOpen, initialFormat, initialUrl, initialLayers, selectedS3Object]);

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Layer name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.data[0]?.url?.trim()) {
      toast({
        title: "Validation Error", 
        description: "URL is required",
        variant: "destructive",
      });
      return false;
    }

    if (['wms', 'wmts'].includes(selectedFormat) && !formData.data[0]?.layers?.trim()) {
      toast({
        title: "Validation Error",
        description: "Layer name is required for WMS/WMTS sources",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const dataSourceItem: DataSourceItem = {
        url: formData.data[0].url,
        format: selectedFormat as DataSourceFormat,
        zIndex: formData.data[0].zIndex || 2,
        layers: formData.data[0].layers,
      };

      onAddDataSource(dataSourceItem);

      // Handle statistics layer creation if enabled
      if (isStatisticsLayer && (selectedFormat === 'flatgeobuf' || selectedFormat === 'geojson')) {
        const nextLevel = getNextLevel();
        const statisticsItem: DataSourceItem = {
          url: formData.data[0].url,
          format: 'statistics' as any,
          zIndex: nextLevel,
          level: nextLevel,
          layers: formData.data[0].layers,
        };
        onAddStatisticsLayer(statisticsItem);
      }

      handleClose();
    } catch (error) {
      console.error('Error adding source:', error);
      toast({
        title: "Error",
        description: "Failed to add data source",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getFormatIcon = (format: SourceConfigType) => {
    switch (format) {
      case 'geojson': return <FileText className="h-4 w-4" />;
      case 'flatgeobuf': return <Database className="h-4 w-4" />;
      case 'cog': return <Globe className="h-4 w-4" />;
      case 'wms':
      case 'wmts': return <MapPin className="h-4 w-4" />;
      case 's3': return <Database className="h-4 w-4" />;
      case 'stac': return <Server className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: SourceConfigType) => {
    switch (format) {
      case 'geojson': return 'text-blue-600 border-l-blue-500';
      case 'flatgeobuf': return 'text-green-600 border-l-green-500';
      case 'cog': return 'text-purple-600 border-l-purple-500';
      case 'wms':
      case 'wmts': return 'text-orange-600 border-l-orange-500';
      case 's3': return 'text-green-600 border-l-green-500';
      case 'stac': return 'text-purple-600 border-l-purple-500';
      default: return 'text-gray-600 border-l-gray-500';
    }
  };

  // Check if current format supports statistics
  const supportsStatistics = selectedFormat === 'flatgeobuf' || selectedFormat === 'geojson';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFormatIcon(selectedFormat)}
            Configure Dataset
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format and Source Info */}
          <Card className={`border-l-4 ${getFormatColor(selectedFormat)}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {getFormatIcon(selectedFormat)}
                <h3 className={`font-medium ${getFormatColor(selectedFormat).split(' ')[0]}`}>
                  {selectedFormat?.toUpperCase()} Dataset
                </h3>
                <Badge variant="outline">
                  {selectedFormat?.toUpperCase()}
                </Badge>
                {selectedService && (
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    From Service: {selectedService.name}
                  </Badge>
                )}
              </div>
              {formData.data[0]?.url && (
                <p className="text-sm text-muted-foreground">{formData.data[0].url}</p>
              )}
              {selectedS3Object && (
                <p className="text-sm text-muted-foreground">
                  S3 Object: {selectedS3Object.key}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Service Configuration */}
          {!selectedService && (
            <ServiceConfigSection
              formData={formData}
              selectedFormat={selectedFormat}
              services={services}
              onUpdateFormData={updateFormData}
              onAddService={onAddService}
            />
          )}

          {/* Statistics Layer Toggle */}
          {supportsStatistics && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="statistics-layer"
                      checked={isStatisticsLayer}
                      onCheckedChange={setIsStatisticsLayer}
                    />
                    <Label htmlFor="statistics-layer">
                      Create Statistics Layer
                    </Label>
                  </div>
                  
                  {isStatisticsLayer && (
                    <div className="text-sm text-muted-foreground">
                      Statistics layer will be created at level {getNextLevel()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layer Card Configuration */}
          <LayerCardConfigSection
            formData={formData}
            interfaceGroups={[]}
            hasFeatureStatistics={hasFeatureStatistics}
            newCategory={newCategory}
            showCategories={showCategories}
            onUpdateFormData={updateFormData}
            onSetHasFeatureStatistics={setHasFeatureStatistics}
            onSetNewCategory={setNewCategory}
            onSetShowCategories={setShowCategories}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Add Dataset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};