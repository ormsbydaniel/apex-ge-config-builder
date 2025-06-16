
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Globe, Server } from 'lucide-react';
import { Service, DataSourceFormat } from '@/types/config';
import { FORMAT_CONFIGS } from '@/constants/formats';
import { useServices } from '@/hooks/useServices';

interface ServicesManagerProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onRemoveService: (index: number) => void;
}

const ServicesManager = ({ services, onAddService, onRemoveService }: ServicesManagerProps) => {
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<DataSourceFormat>('wms');
  const [showAddForm, setShowAddForm] = useState(false);

  const { addService, isLoadingCapabilities } = useServices(services, onAddService);

  const handleAddService = async () => {
    if (newServiceName.trim() && newServiceUrl.trim()) {
      await addService(newServiceName, newServiceUrl, selectedFormat);
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

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Configured Services
            </div>
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="bg-primary hover:bg-primary/90"
              disabled={showAddForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </CardTitle>
          <CardDescription>
            Configure WMS and WMTS services that can be used across multiple data sources. Services support automatic layer discovery via GetCapabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="border-primary/30 mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Add New Service</CardTitle>
                <CardDescription>
                  Configure a new WMS or WMTS service endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceFormat">Service Type</Label>
                  <Select
                    value={selectedFormat}
                    onValueChange={(value: DataSourceFormat) => setSelectedFormat(value)}
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input
                      id="serviceName"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g., Terrascope WMS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceUrl">Service URL</Label>
                    <Input
                      id="serviceUrl"
                      value={newServiceUrl}
                      onChange={(e) => setNewServiceUrl(e.target.value)}
                      placeholder={FORMAT_CONFIGS[selectedFormat].urlPlaceholder}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
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
              <p className="mb-4">Add your first WMS or WMTS service to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, index) => (
                <Card key={service.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <h5 className="font-medium text-blue-700">{service.name}</h5>
                          <Badge variant="outline" className="border-blue-300 text-blue-700">
                            {service.format.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 break-all mb-2">{service.url}</p>
                        {service.capabilities?.title && (
                          <p className="text-sm text-slate-600 mb-2">{service.capabilities.title}</p>
                        )}
                        {service.capabilities?.layers.length ? (
                          <Badge variant="outline" className="border-green-300 text-green-700">
                            {service.capabilities.layers.length} layers available
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
