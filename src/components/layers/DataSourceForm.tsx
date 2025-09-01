import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, X, Database, Globe, Plus, Server } from 'lucide-react';
import { Service, DataSourceFormat, DataSourceItem } from '@/types/config';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
import { ServiceSelectionModal } from './components/ServiceSelectionModals';
import { FormatSelectionCards } from './components/FormatSelectionCards';
import { DatasetDetailsModal } from './components/DatasetDetailsModal';
import { S3Object } from '@/utils/s3Utils';

interface DataSourceFormProps {
  services: Service[];
  currentLayerStatistics?: DataSourceItem[];
  layerType?: LayerTypeOption;
  onAddDataSource: (dataSource: DataSourceItem) => void;
  onAddStatisticsLayer: (statisticsItem: DataSourceItem) => void;
  onAddService: (service: Service) => void;
  onCancel: () => void;
}

const DataSourceForm = ({ 
  services, 
  currentLayerStatistics = [],
  layerType = 'standard',
  onAddDataSource, 
  onAddStatisticsLayer,
  onAddService, 
  onCancel 
}: DataSourceFormProps) => {
  const { toast } = useToast();
  const { addService } = useServices(services, onAddService);
  
  const [sourceType, setSourceType] = useState<'service' | 'direct' | 'format-selection'>('direct');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  
  // Dataset details modal state
  const [datasetModalData, setDatasetModalData] = useState<{
    format?: DataSourceFormat;
    url?: string;
    layers?: string;
    service?: Service | null;
    s3Object?: S3Object | null;
  }>({});

  const handleServiceSelect = (service: Service) => {
    setSelectedServiceForModal(service);
    setShowServiceModal(true);
  };

  const handleServiceModalSelection = (url: string, layers: string = '', format?: DataSourceFormat) => {
    // Set up data for dataset details modal
    setDatasetModalData({
      format,
      url,
      layers,
      service: selectedServiceForModal,
    });
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
    setShowDatasetModal(true);
  };

  const handleFormatSelect = (format: DataSourceFormat) => {
    setDatasetModalData({
      format,
      service: null,
    });
    setSourceType('direct');
    setShowDatasetModal(true);
  };

  const handleDatasetModalClose = () => {
    setShowDatasetModal(false);
    setDatasetModalData({});
  };

  const renderServiceCards = () => {
    const s3Services = services.filter(service => 
      service.sourceType === 's3' || service.url.includes('s3.amazonaws.com') || service.url.includes('.s3.')
    );
    const stacServices = services.filter(service => service.sourceType === 'stac');
    const standardServices = services.filter(service => 
      service.sourceType !== 's3' && service.sourceType !== 'stac' && 
      !service.url.includes('s3.amazonaws.com') && !service.url.includes('.s3.')
    );

    const getServiceIcon = (service: Service) => {
      if (service.sourceType === 's3' || service.url.includes('s3.amazonaws.com') || service.url.includes('.s3.')) {
        return <Database className="h-5 w-5 text-green-600" />;
      }
      if (service.sourceType === 'stac') {
        return <Server className="h-5 w-5 text-purple-600" />;
      }
      return <Globe className="h-5 w-5 text-blue-600" />;
    };

    const getServiceTypeLabel = (service: Service) => {
      if (service.sourceType === 's3' || service.url.includes('s3.amazonaws.com') || service.url.includes('.s3.')) {
        return 'S3 Bucket';
      }
      if (service.sourceType === 'stac') {
        return 'STAC';
      }
      return service.format?.toUpperCase();
    };

    const getServiceTypeColor = (service: Service) => {
      if (service.sourceType === 's3' || service.url.includes('s3.amazonaws.com') || service.url.includes('.s3.')) {
        return 'border-green-300 text-green-700';
      }
      if (service.sourceType === 'stac') {
        return 'border-purple-300 text-purple-700';
      }
      return 'border-blue-300 text-blue-700';
    };

    const renderServiceGroup = (groupServices: Service[], title: string) => {
      if (groupServices.length === 0) return null;
      
      return (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
          {groupServices.map((service) => (
            <Card 
              key={service.id}
              className={`border-l-4 ${
                service.sourceType === 's3' || service.url.includes('s3.amazonaws.com') || service.url.includes('.s3.') ? 'border-l-green-500' : 
                service.sourceType === 'stac' ? 'border-l-purple-500' : 
                'border-l-blue-500'
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleServiceSelect(service)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(service)}
                    <div>
                      <h3 className={`font-medium ${
                        service.sourceType === 's3' || service.url.includes('s3.amazonaws.com') || service.url.includes('.s3.') ? 'text-green-700' : 
                        service.sourceType === 'stac' ? 'text-purple-700' : 
                        'text-blue-700'
                      }`}>
                        {service.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{service.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getServiceTypeColor(service)}>
                      {getServiceTypeLabel(service)}
                    </Badge>
                    {service.capabilities?.layers.length && (
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        {service.capabilities.layers.length} available
                      </Badge>
                    )}
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {renderServiceGroup(s3Services, "S3 Buckets")}
        {renderServiceGroup(stacServices, "STAC Services")}
        {renderServiceGroup(standardServices, "Map Services")}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Source Type Selection */}
            <div className="flex gap-4">
              <Button
                variant={sourceType === 'direct' ? 'default' : 'outline'}
                onClick={() => setSourceType('direct')}
                className="flex-1"
              >
                Direct Connection
              </Button>
              <Button
                variant={sourceType === 'service' ? 'default' : 'outline'}
                onClick={() => setSourceType('service')}
                className="flex-1"
              >
                From Service
              </Button>
            </div>

            {/* Content based on source type */}
            {sourceType === 'direct' && (
              <FormatSelectionCards
                onFormatSelect={handleFormatSelect}
                onCancel={onCancel}
              />
            )}

            {sourceType === 'service' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Available Services</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a configured service to add data from.
                  </p>
                </div>
                
                {services.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No services configured</p>
                    <p className="text-sm mt-1">Add a service first to use this option</p>
                  </div>
                ) : (
                  renderServiceCards()
                )}

                {/* Cancel button for service view */}
                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Selection Modal */}
      <ServiceSelectionModal
        service={selectedServiceForModal}
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setSelectedServiceForModal(null);
        }}
        onSelect={handleServiceModalSelection}
      />

      {/* Dataset Details Modal */}
      <DatasetDetailsModal
        isOpen={showDatasetModal}
        onClose={handleDatasetModalClose}
        onAddDataSource={onAddDataSource}
        onAddStatisticsLayer={onAddStatisticsLayer}
        services={services}
        onAddService={onAddService}
        initialFormat={datasetModalData.format}
        initialUrl={datasetModalData.url}
        initialLayers={datasetModalData.layers}
        selectedService={datasetModalData.service}
        selectedS3Object={datasetModalData.s3Object}
      />
    </>
  );
};

export default DataSourceForm;