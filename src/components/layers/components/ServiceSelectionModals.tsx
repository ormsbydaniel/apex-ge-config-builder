import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Globe, Server, X } from 'lucide-react';
import { Service, DataSourceFormat } from '@/types/config';
import { validateS3Url, S3Object } from '@/utils/s3Utils';
import S3LayerSelector from '@/components/form/S3LayerSelector';

interface ServiceSelectionModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, layers?: string, format?: DataSourceFormat) => void;
}

export const ServiceSelectionModal = ({ service, isOpen, onClose, onSelect }: ServiceSelectionModalProps) => {
  const [selectedLayer, setSelectedLayer] = useState('');
  const [selectedS3Object, setSelectedS3Object] = useState<S3Object | null>(null);
  const [detectedS3Format, setDetectedS3Format] = useState<DataSourceFormat | null>(null);

  if (!service) return null;

  const isS3Service = service.sourceType === 's3' || validateS3Url(service.url);
  const isStacService = service.sourceType === 'stac';

  const handleS3ObjectSelect = (object: S3Object, detectedFormat: DataSourceFormat) => {
    onSelect(object.url, '', detectedFormat);
    handleClose();
  };

  const handleConfirmSelection = () => {
    if (isS3Service && selectedS3Object && detectedS3Format) {
      onSelect(selectedS3Object.url, '', detectedS3Format);
    } else if (isStacService) {
      // For STAC, we'll use the service URL directly and let the user configure the collection
      onSelect(service.url, '', service.format as DataSourceFormat);
    } else if (selectedLayer) {
      onSelect(service.url, selectedLayer, service.format as DataSourceFormat);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedLayer('');
    setSelectedS3Object(null);
    setDetectedS3Format(null);
    onClose();
  };

  const getServiceIcon = () => {
    if (isS3Service) return <Database className="h-5 w-5 text-green-600" />;
    if (isStacService) return <Server className="h-5 w-5 text-purple-600" />;
    return <Globe className="h-5 w-5 text-blue-600" />;
  };

  const getServiceTypeLabel = () => {
    if (isS3Service) return 'S3 Bucket';
    if (isStacService) return 'STAC';
    return service.format?.toUpperCase();
  };

  const getServiceTypeColor = () => {
    if (isS3Service) return 'border-green-300 text-green-700';
    if (isStacService) return 'border-purple-300 text-purple-700';
    return 'border-blue-300 text-blue-700';
  };

  const canConfirm = () => {
    if (isS3Service) return selectedS3Object && detectedS3Format;
    if (isStacService) return true; // STAC services can be selected directly
    return selectedLayer;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getServiceIcon()}
            Select from {service.name}
          </DialogTitle>
          <DialogDescription>
            Choose the specific {isS3Service ? 'object' : isStacService ? 'collection' : 'layer'} you want to add to your configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Info Card */}
          <Card className={`border-l-4 ${
            isS3Service ? 'border-l-green-500' : 
            isStacService ? 'border-l-purple-500' : 
            'border-l-blue-500'
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {getServiceIcon()}
                <h3 className={`font-medium ${
                  isS3Service ? 'text-green-700' : 
                  isStacService ? 'text-purple-700' : 
                  'text-blue-700'
                }`}>
                  {service.name}
                </h3>
                <Badge variant="outline" className={getServiceTypeColor()}>
                  {getServiceTypeLabel()}
                </Badge>
                {service.capabilities?.layers.length && (
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {service.capabilities.layers.length} {
                      isS3Service ? 'objects' : 
                      isStacService ? 'collections' : 
                      'layers'
                    } available
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{service.url}</p>
            </CardContent>
          </Card>

          {/* Selection Interface */}
          {isS3Service ? (
            <S3LayerSelector
              bucketUrl={service.url}
              onObjectSelect={handleS3ObjectSelect}
            />
          ) : isStacService ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">
                  STAC collections will be available for selection in the layer configuration after adding this service.
                </p>
              </div>
              {service.capabilities?.layers.length ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Available Collections:</h4>
                  <div className="grid gap-2 max-h-60 overflow-auto">
                    {service.capabilities.layers.map((layer) => (
                      <div key={layer.name} className="p-2 border rounded text-sm">
                        <div className="font-medium">{layer.title || layer.name}</div>
                        {layer.title !== layer.name && (
                          <div className="text-xs text-muted-foreground">{layer.name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Layer *</label>
                {service.capabilities?.layers.length ? (
                  <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a layer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {service.capabilities.layers.map((layer) => (
                        <SelectItem key={layer.name} value={layer.name}>
                          <div>
                            <div className="font-medium">{layer.title || layer.name}</div>
                            {layer.title !== layer.name && (
                              <div className="text-xs text-muted-foreground">{layer.name}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700">
                      No layers found via GetCapabilities. You can proceed and manually configure the layer name in the next step.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!isS3Service && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={!canConfirm()}
              className="bg-primary hover:bg-primary/90"
            >
              Select & Configure
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};