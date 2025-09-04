
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Globe } from 'lucide-react';
import { DataSource, DataSourceFormat, Service, SourceConfigType } from '@/types/config';
import { S3Object, validateS3Url } from '@/utils/s3Utils';
import { FORMAT_CONFIGS } from '@/constants/formats';
import { useServices } from '@/hooks/useServices';
import S3ServiceConfigSection from './S3ServiceConfigSection';

interface ServiceConfigSectionProps {
  formData: DataSource;
  selectedFormat: SourceConfigType;
  services: Service[];
  onUpdateFormData: (path: string, value: any) => void;
  onAddService: (service: Service) => void;
  onObjectSelect?: (object: S3Object, detectedFormat: DataSourceFormat) => void;
}

const ServiceConfigSection = ({
  formData,
  selectedFormat,
  services,
  onUpdateFormData,
  onAddService,
  onObjectSelect
}: ServiceConfigSectionProps) => {
  // Check if selected service is an S3 service or if S3 format is selected
  const selectedService = services.find(s => s.id === formData.data[0]?.serviceId);
  const isS3Service = selectedService && (selectedService.sourceType === 's3' || (selectedService.url && validateS3Url(selectedService.url)));
  
  // ALWAYS log this - more visible logging
  console.log('🔍 ServiceConfigSection Analysis:', {
    selectedFormat,
    selectedServiceId: formData.data[0]?.serviceId,
    selectedService: selectedService ? {
      id: selectedService.id,
      name: selectedService.name,
      url: selectedService.url,
      sourceType: selectedService.sourceType,
      format: selectedService.format,
      isValidS3Url: selectedService.url ? validateS3Url(selectedService.url) : false
    } : null,
    isS3Service,
    willShowS3Browser: selectedFormat === 's3' || isS3Service
  });
  
  // If S3 format is selected OR selected service is S3, use the specialized S3 component
  if (selectedFormat === 's3' || isS3Service) {
    console.log('✅ Rendering S3ServiceConfigSection');
    return (
      <S3ServiceConfigSection
        formData={formData}
        services={services}
        onUpdateFormData={onUpdateFormData}
        onAddService={onAddService}
        onObjectSelect={onObjectSelect}
      />
    );
  }
  
  console.log('❌ Rendering regular ServiceConfigSection (not S3)');

  const config = FORMAT_CONFIGS[selectedFormat as DataSourceFormat];
  const { addService, isLoadingCapabilities } = useServices(services, onAddService);
  
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  const formatServices = services.filter(s => s.format === selectedFormat);
  // selectedService is already defined above

  const handleAddService = async () => {
    if (newServiceName.trim() && newServiceUrl.trim()) {
      await addService(newServiceName, newServiceUrl, selectedFormat as DataSourceFormat);
      setNewServiceName('');
      setNewServiceUrl('');
      setShowNewServiceForm(false);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      onUpdateFormData('data.0.serviceId', serviceId);
      onUpdateFormData('data.0.url', service.url);
      // Clear layer selection when changing service
      onUpdateFormData('data.0.layers', '');
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Globe className="h-5 w-5" />
          {(selectedFormat as string).toUpperCase()} Service Configuration
        </CardTitle>
        <CardDescription>
          Configure the {(selectedFormat as string).toUpperCase()} service endpoint. Services can be reused across multiple layers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service">Select Service</Label>
          <div className="flex gap-2">
            <Select
              value={formData.data[0]?.serviceId || ''}
              onValueChange={handleServiceSelect}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${selectedFormat.toUpperCase()} service or add new`} />
              </SelectTrigger>
              <SelectContent>
                {formatServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      {service.capabilities?.layers.length && (
                        <Badge variant="secondary" className="ml-2">
                          {service.capabilities.layers.length} layers
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewServiceForm(!showNewServiceForm)}
              className="border-primary/30"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showNewServiceForm && (
          <Card className="border-primary/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Add New {selectedFormat.toUpperCase()} Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newServiceName">Service Name</Label>
                  <Input
                    id="newServiceName"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g., Terrascope WMS"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newServiceUrl">Service URL</Label>
                  <Input
                    id="newServiceUrl"
                    value={newServiceUrl}
                    onChange={(e) => setNewServiceUrl(e.target.value)}
                    placeholder={config.urlPlaceholder}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddService}
                  disabled={!newServiceName.trim() || !newServiceUrl.trim() || isLoadingCapabilities}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoadingCapabilities ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Service...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewServiceForm(false);
                    setNewServiceName('');
                    setNewServiceUrl('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedService && config.requiresLayers && (
          <div className="space-y-2">
            <Label htmlFor="layers">Layer Name *</Label>
            {selectedService.capabilities?.layers.length ? (
              <Select
                value={formData.data[0]?.layers || ''}
                onValueChange={(value) => onUpdateFormData('data.0.layers', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layer from service" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {selectedService.capabilities.layers.map((layer) => (
                    <SelectItem key={layer.name} value={layer.name}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{layer.title || layer.name}</span>
                        {layer.title !== layer.name && (
                          <span className="text-xs text-muted-foreground">{layer.name}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="layers"
                value={formData.data[0]?.layers || ''}
                onChange={(e) => onUpdateFormData('data.0.layers', e.target.value)}
                placeholder={config.layersPlaceholder}
                required
              />
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="zIndex">Z-Index</Label>
          <Input
            id="zIndex"
            type="number"
            value={formData.data[0]?.zIndex || 2}
            onChange={(e) => onUpdateFormData('data.0.zIndex', parseInt(e.target.value) || 2)}
            min="0"
            max="100"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceConfigSection;
