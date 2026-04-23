import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Database, Globe, Server, Loader2 } from 'lucide-react';
import { Service, DataSourceFormat } from '@/types/config';
import { validateS3Url, S3Selection } from '@/utils/s3Utils';
import S3LayerSelector from '@/components/form/S3LayerSelector';
import StacBrowser from './StacBrowser';
import { useLazyServiceCapabilities } from '@/hooks/useLazyServiceCapabilities';

import { AssetSelection } from './StacBrowser';

type SourceContext = 'data' | 'chart' | 'statistics' | 'constraint';

const SOURCE_CONTEXT_LABELS: Record<SourceContext, string> = {
  data: 'Data',
  chart: 'Chart',
  statistics: 'Statistics',
  constraint: 'Constraint',
};

interface ServiceSelectionModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: string | AssetSelection[], layers?: string, format?: DataSourceFormat | string, datetime?: string) => void;
  allowedFormats?: string[];
  sourceContext?: SourceContext;
}

export const ServiceSelectionModal = ({ service, isOpen, onClose, onSelect, allowedFormats, sourceContext = 'data' }: ServiceSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Compute lazy-load eligibility from raw inputs so hooks always run in the same order.
  const isS3ServiceRaw = service?.sourceType === 's3' || (!!service?.url && validateS3Url(service.url));
  const isStacServiceRaw = service?.sourceType === 'stac';
  const shouldLazyLoad = !!service && isOpen && !isS3ServiceRaw && !isStacServiceRaw;
  const { isLoading: capsLoading } = useLazyServiceCapabilities(service, shouldLazyLoad);

  if (!service) return null;

  const isS3Service = isS3ServiceRaw;
  const isStacService = isStacServiceRaw;

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
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col">
        {!isStacService && (
          <DialogHeader className="pb-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              Select {SOURCE_CONTEXT_LABELS[sourceContext]} Source
              <span className="text-muted-foreground font-normal text-sm">—</span>
              {getServiceIcon()}
              <span className={`font-medium text-sm ${isS3Service ? 'text-green-700' : 'text-blue-700'}`}>
                {service.name}
              </span>
              <Badge variant="outline" className={`${getServiceTypeColor()} text-xs`}>
                {getServiceTypeLabel()}
              </Badge>
              {service.capabilities?.layers.length && (
                <Badge variant="outline" className="border-green-300 text-green-700 text-xs">
                  {service.capabilities.totalCount || service.capabilities.layers.length} {isS3Service ? 'objects' : 'layers'}
                </Badge>
              )}
            </DialogTitle>
            <p className="text-xs text-muted-foreground truncate">{service.url}</p>
          </DialogHeader>
        )}


        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* Selection Interface */}
          {isS3Service ? (
            <S3LayerSelector
              bucketUrl={service.url}
              onObjectSelect={handleS3ObjectSelect}
              allowedFormats={allowedFormats}
              sourceContext={sourceContext}
            />
          ) : isStacService ? (
            <StacBrowser
              serviceUrl={service.url}
              serviceName={service.name}
              onAssetSelect={(selection) => {
                if (Array.isArray(selection)) {
                  onSelect(selection);
                } else {
                  onSelect(selection.url, '', selection.format, selection.datetime);
                }
                handleClose();
              }}
            />
          ) : (
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search layers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-input rounded-md"
                />
              </div>
              {capsLoading && !service.capabilities?.layers.length ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Fetching service capabilities…
                </div>
              ) : service.capabilities?.layers.length ? (
                <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
                  <div className="grid gap-px p-1">
                    {filteredLayers.map((layer) => (
                      <div key={layer.name} className="flex items-center gap-2 py-1.5 px-2 border rounded hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{layer.title || layer.name}</div>
                          {layer.title !== layer.name && (
                            <div className="text-xs text-muted-foreground">{layer.name}</div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="shrink-0 h-7 text-xs"
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
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    No layers found. You can manually configure the layer name in the next step.
                  </p>
                </div>
              )}
              {service.capabilities?.layers.length && (
                <span className="text-xs text-muted-foreground">
                  {filteredLayers.length} of {service.capabilities.layers.length} layers
                </span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};