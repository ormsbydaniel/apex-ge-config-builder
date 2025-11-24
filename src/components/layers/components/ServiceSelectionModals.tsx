import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Globe, Server } from 'lucide-react';
import { Service, DataSourceFormat } from '@/types/config';
import { validateS3Url, S3Selection } from '@/utils/s3Utils';
import S3LayerSelector from '@/components/form/S3LayerSelector';
import StacBrowser from './StacBrowser';

import { AssetSelection } from './StacBrowser';

interface ServiceSelectionModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: string | AssetSelection[], layers?: string, format?: DataSourceFormat | string, datetime?: string) => void;
}

export const ServiceSelectionModal = ({ service, isOpen, onClose, onSelect }: ServiceSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!service) return null;

  const isS3Service = service.sourceType === 's3' || validateS3Url(service.url);
  const isStacService = service.sourceType === 'stac';

  const handleS3ObjectSelect = (selection: S3Selection | S3Selection[]) => {
    if (Array.isArray(selection)) {
      // Bulk selection - map to AssetSelection format
      const assetSelections: AssetSelection[] = selection.map(s => ({
        url: s.url,
        format: s.format,
        datetime: undefined
      }));
      onSelect(assetSelections);
    } else {
      // Single selection
      onSelect(selection.url, '', selection.format);
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };
  
  const filteredLayers = service?.capabilities?.layers.filter(layer => 
    !searchTerm || 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (layer.title && layer.title.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {!isStacService && (
          <DialogHeader>
            <DialogTitle>Select Data Source</DialogTitle>
            <DialogDescription>
              Select a data source from the {getServiceTypeLabel()} service
            </DialogDescription>
          </DialogHeader>
        )}
        
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Service Info Card - not shown for STAC services (delegated to StacBrowser) */}
          {!isStacService && (
            <Card className={`border-l-4 ${
              isS3Service ? 'border-l-green-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {getServiceIcon()}
                  <h3 className={`font-medium ${
                    isS3Service ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {service.name}
                  </h3>
                  <Badge variant="outline" className={getServiceTypeColor()}>
                    {getServiceTypeLabel()}
                  </Badge>
                  {service.capabilities?.layers.length && (
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {service.capabilities.totalCount || service.capabilities.layers.length} {
                        isS3Service ? 'objects' : 'layers'
                      } available
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{service.url}</p>
              </CardContent>
            </Card>
          )}


          {/* Selection Interface */}
          {isS3Service ? (
            <S3LayerSelector
              bucketUrl={service.url}
              onObjectSelect={handleS3ObjectSelect}
            />
          ) : isStacService ? (
            <StacBrowser
              serviceUrl={service.url}
              serviceName={service.name}
              onAssetSelect={(selection) => {
                // Handle both single and bulk selections
                if (Array.isArray(selection)) {
                  onSelect(selection);
                } else {
                  // Convert single selection to old format for compatibility
                  onSelect(selection.url, '', selection.format, selection.datetime);
                }
                handleClose();
              }}
            />
          ) : (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Layers</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-input rounded-md"
                />
              </div>
              {service.capabilities?.layers.length ? (
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <div className="grid gap-2 p-2">
                    {filteredLayers.map((layer) => (
                      <div key={layer.name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium text-sm">{layer.title || layer.name}</div>
                          {layer.title !== layer.name && (
                            <div className="text-xs text-muted-foreground mt-1">{layer.name}</div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-shrink-0"
                          onClick={() => {
                            onSelect(service.url, layer.name, service.format as DataSourceFormat);
                            handleClose();
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    No layers found via GetCapabilities. You can proceed and manually configure the layer name in the next step.
                  </p>
                </div>
              )}
              {service.capabilities?.layers.length && (
                <div className="text-xs text-muted-foreground">
                  Showing {filteredLayers.length} of {service.capabilities.layers.length} layers
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};