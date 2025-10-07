
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Globe, Server, Database, Download } from 'lucide-react';
import { Service, DataSourceFormat, SourceConfigType } from '@/types/config';
import { FORMAT_CONFIGS, S3_CONFIG, STAC_CONFIG } from '@/constants/formats';
import { useServices } from '@/hooks/useServices';
import { fetchRecommendedServices } from '@/utils/recommendedBaseLayers';
import { toast } from '@/hooks/use-toast';

interface ServicesManagerProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onRemoveService: (index: number) => void;
}

const ServicesManager = ({ services, onAddService, onRemoveService }: ServicesManagerProps) => {
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<SourceConfigType>('wms');
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoNameLoading, setAutoNameLoading] = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const { addService, isLoadingCapabilities } = useServices(services, onAddService);

  // Auto-populate STAC service name after user pauses typing URL
  useEffect(() => {
    if (selectedFormat !== 'stac') return;
    const url = newServiceUrl.trim();
    if (!url) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setAutoNameLoading(true);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        const title = json.title || json.id;
        if (title && !newServiceName.trim()) {
          setNewServiceName(title);
        }
      } catch (_) {
        // ignore typing cancellations/errors
      } finally {
        setAutoNameLoading(false);
      }
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [newServiceUrl, selectedFormat]);

  const handleAddService = async () => {
    if (newServiceUrl.trim()) {
      if (selectedFormat === 's3') {
        // For S3, create a service with a placeholder format since the actual format will be determined by file extension
        await addService(newServiceName, newServiceUrl, 'cog', 's3');
      } else if (selectedFormat === 'stac') {
        // For STAC, the service name will be auto-populated from catalogue title
        await addService(newServiceName, newServiceUrl, 'stac', 'stac');
      } else {
        await addService(newServiceName, newServiceUrl, selectedFormat as DataSourceFormat, 'service');
      }
      setNewServiceName('');
      setNewServiceUrl('');
      setShowAddForm(false);
    }
  };

  const handleCancel = () => {
    setNewServiceName('');
    setNewServiceUrl('');
    setShowAddForm(false);
  };

  const handleAddRecommendedServices = async () => {
    setIsLoadingRecommended(true);
    try {
      const recommendedServices = await fetchRecommendedServices();
      
      if (recommendedServices.length === 0) {
        toast({
          title: "No services found",
          description: "The recommended config doesn't contain any services.",
          variant: "default"
        });
        return;
      }

      // Filter out services that already exist (by URL)
      const existingUrls = new Set(services.map(s => s.url));
      const newServices = recommendedServices.filter(s => !existingUrls.has(s.url));

      if (newServices.length === 0) {
        toast({
          title: "All services already added",
          description: "All recommended services are already configured.",
          variant: "default"
        });
        return;
      }

      // Add each service with GetCapabilities calls
      let addedCount = 0;
      for (const service of newServices) {
        try {
          const sourceType = service.sourceType || (service.format === 'stac' ? 'stac' : 'service');
          const format = service.format === 's3' ? 'cog' : (service.format || 'wms');
          await addService(
            service.name, 
            service.url, 
            format as DataSourceFormat | 'stac',
            sourceType
          );
          addedCount++;
        } catch (error) {
          console.error(`Failed to add service ${service.name}:`, error);
        }
      }

      toast({
        title: "Services added",
        description: `Successfully added ${addedCount} recommended service${addedCount !== 1 ? 's' : ''} with capabilities.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Failed to load services",
        description: error instanceof Error ? error.message : "An error occurred while fetching recommended services.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  const getConfigForType = (type: SourceConfigType) => {
    if (type === 's3') {
      return S3_CONFIG;
    }
    if (type === 'stac') {
      return STAC_CONFIG;
    }
    return FORMAT_CONFIGS[type as DataSourceFormat];
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configured Services
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleAddRecommendedServices}
                variant="outline"
                disabled={isLoadingRecommended || showAddForm}
                className="border-primary/30"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoadingRecommended ? 'Loading...' : 'Add Recommended Services'}
              </Button>
              <Button 
                onClick={() => setShowAddForm(true)} 
                className="bg-primary hover:bg-primary/90"
                disabled={showAddForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Configure WMS, WMTS, S3, and STAC services that can be used across multiple data sources. Services support automatic discovery via GetCapabilities, bucket listing, or catalogue metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="border-primary/30 mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Add New Service</CardTitle>
                <CardDescription>
                  Configure a new WMS, WMTS, S3, or STAC service endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceFormat">Service Type</Label>
                  <Select
                    value={selectedFormat}
                    onValueChange={(value: SourceConfigType) => setSelectedFormat(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wms">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {FORMAT_CONFIGS.wms.label}
                        </div>
                      </SelectItem>
                      <SelectItem value="wmts">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {FORMAT_CONFIGS.wmts.label}
                        </div>
                      </SelectItem>
                      <SelectItem value="s3">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {S3_CONFIG.label}
                        </div>
                      </SelectItem>
                      <SelectItem value="stac">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          {STAC_CONFIG.label}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceUrl">Service URL</Label>
                    <Input
                      id="serviceUrl"
                      value={newServiceUrl}
                      onChange={(e) => setNewServiceUrl(e.target.value)}
                      placeholder={getConfigForType(selectedFormat).urlPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">
                      Service Name {selectedFormat === 'stac' && <span className="text-xs text-muted-foreground">(auto-populated from catalogue)</span>}
                    </Label>
                    <Input
                      id="serviceName"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder={
                        selectedFormat === 's3' ? 'e.g., ESA APEX S3 Bucket' :
                        selectedFormat === 'stac' ? 'Will be auto-populated...' :
                        'e.g., Terrascope WMS'
                      }
                      disabled={selectedFormat === 'stac' && autoNameLoading}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddService}
                    disabled={!newServiceUrl.trim() || isLoadingCapabilities}
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
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {services.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No services configured yet</h3>
              <p className="mb-4">Add your first WMS, WMTS, S3, or STAC service to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, index) => (
                <Card key={service.id} className={`border-l-4 ${
                  service.sourceType === 's3' ? 'border-l-green-500' : 
                  service.sourceType === 'stac' ? 'border-l-purple-500' : 
                  'border-l-blue-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {service.sourceType === 's3' ? (
                            <Database className="h-4 w-4 text-green-600" />
                          ) : service.sourceType === 'stac' ? (
                            <Server className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Globe className="h-4 w-4 text-blue-600" />
                          )}
                          <h5 className={`font-medium ${
                            service.sourceType === 's3' ? 'text-green-700' : 
                            service.sourceType === 'stac' ? 'text-purple-700' : 
                            'text-blue-700'
                          }`}>
                            {service.name}
                          </h5>
                          <Badge variant="outline" className={`${
                            service.sourceType === 's3' ? 'border-green-300 text-green-700' : 
                            service.sourceType === 'stac' ? 'border-purple-300 text-purple-700' : 
                            'border-blue-300 text-blue-700'
                          }`}>
                            {service.sourceType === 's3' ? 'S3 Bucket' : 
                             service.sourceType === 'stac' ? 'STAC' : 
                             service.format?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 break-all mb-2">{service.url}</p>
                        {service.capabilities?.title && (
                          <p className="text-sm text-slate-600 mb-2">{service.capabilities.title}</p>
                        )}
                        {service.capabilities?.layers.length ? (
                          <Badge variant="outline" className="border-green-300 text-green-700">
                            {service.capabilities.layers.length} {
                              service.sourceType === 's3' ? 'objects' : 
                              service.sourceType === 'stac' ? 'collections' : 
                              'layers'
                            } available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Manual configuration required
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveService(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesManager;
