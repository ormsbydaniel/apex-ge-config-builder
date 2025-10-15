
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Database, Plus, Loader2 } from 'lucide-react';
import { validateS3Url, S3Selection, getFormatFromExtension } from '@/utils/s3Utils';
import { DataSource, Service, DataSourceFormat } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import S3LayerSelector from './S3LayerSelector';

interface S3ServiceConfigSectionProps {
  formData: DataSource;
  services: Service[];
  onUpdateFormData: (path: string, value: any) => void;
  onAddService: (service: Service) => void;
  onObjectSelect?: (selection: S3Selection | S3Selection[]) => void;
}

const S3ServiceConfigSection = ({
  formData,
  services,
  onUpdateFormData,
  onAddService,
  onObjectSelect
}: S3ServiceConfigSectionProps) => {
  const { toast } = useToast();
  
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  // Filter services to show only S3 services (allow both 's3' sourceType and 'cog' format for backwards compatibility)
  const s3Services = services.filter(s => s.sourceType === 's3' || (s.url && validateS3Url(s.url)));
  const selectedService = services.find(s => s.id === formData.data[0]?.serviceId);
  const isValidUrl = formData.data[0]?.url ? validateS3Url(formData.data[0].url) : true;

  // Debug logging to understand the state
  console.log('S3ServiceConfigSection Debug:', {
    s3Services: s3Services.map(s => ({ id: s.id, name: s.name, url: s.url, sourceType: s.sourceType })),
    selectedServiceId: formData.data[0]?.serviceId,
    selectedService: selectedService ? { id: selectedService.id, name: selectedService.name, url: selectedService.url, sourceType: selectedService.sourceType } : null,
    formDataUrl: formData.data[0]?.url,
    isValidUrl,
    shouldShowBrowser: !!(selectedService && selectedService.url && validateS3Url(selectedService.url))
  });

  const handleAddService = async () => {
    if (newServiceName.trim() && newServiceUrl.trim()) {
      if (!validateS3Url(newServiceUrl)) {
        toast({
          title: "Invalid S3 URL",
          description: "Please enter a valid S3 bucket URL",
          variant: "destructive"
        });
        return;
      }

      // Create S3 service with appropriate format and sourceType
      const s3Service: Service = {
        id: crypto.randomUUID(),
        name: newServiceName,
        url: newServiceUrl,
        format: 'cog' as DataSourceFormat, // Default format, will be overridden by file detection
        sourceType: 's3'
      };
      
      onAddService(s3Service);
      setNewServiceName('');
      setNewServiceUrl('');
      setShowNewServiceForm(false);
      
      toast({
        title: "S3 Service Added",
        description: `Service "${newServiceName}" has been added successfully.`,
      });
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      onUpdateFormData('data.0.serviceId', serviceId);
      onUpdateFormData('data.0.url', service.url);
      // Don't set a format yet - it will be determined when a file is selected
    }
  };

  const handleS3ObjectSelect = (selection: S3Selection | S3Selection[]) => {
    // Handle single selection for this component (bulk handled elsewhere)
    if (Array.isArray(selection)) {
      // For bulk operations in this context, just use the first one
      // (actual bulk handling happens in parent components)
      if (selection.length > 0) {
        const first = selection[0];
        onUpdateFormData('data.0.url', first.url);
        onUpdateFormData('data.0.format', first.format);
      }
    } else {
      // Single selection
      onUpdateFormData('data.0.url', selection.url);
      onUpdateFormData('data.0.format', selection.format);

      toast({
        title: "S3 Object Selected",
        description: `Selected ${selection.key} (detected as ${selection.format.toUpperCase()})`,
      });
    }
    
    // Call parent callback if provided
    if (onObjectSelect) {
      onObjectSelect(selection);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Database className="h-5 w-5" />
          S3 Bucket Configuration
        </CardTitle>
        <CardDescription>
          Configure access to an Amazon S3 bucket containing geospatial data files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Required S3 Bucket Settings:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Public Read Access:</strong> Bucket policy must allow public read access for the objects you want to use</li>
              <li>• <strong>CORS Configuration:</strong> Must allow GET requests from your domain</li>
              <li>• <strong>List Objects Permission:</strong> Bucket must allow listing objects for browsing</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="service">Select S3 Service</Label>
          <div className="flex gap-2">
            <Select
              value={formData.data[0]?.serviceId || ''}
              onValueChange={handleServiceSelect}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select S3 service or add new" />
              </SelectTrigger>
              <SelectContent>
                {s3Services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        S3 Bucket
                      </Badge>
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
              <CardTitle className="text-base">Add New S3 Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newServiceName">Service Name</Label>
                  <Input
                    id="newServiceName"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g., ESA APEX Data"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newServiceUrl">S3 Bucket URL</Label>
                  <Input
                    id="newServiceUrl"
                    value={newServiceUrl}
                    onChange={(e) => setNewServiceUrl(e.target.value)}
                    placeholder="https://esa-apex.s3.eu-west-1.amazonaws.com/"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddService}
                  disabled={!newServiceName.trim() || !newServiceUrl.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
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

        {/* S3 File Browser - Show when service is selected */}
        {selectedService && selectedService.url && validateS3Url(selectedService.url) && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-green-700">Browse S3 Files</CardTitle>
              <CardDescription>
                Select a file from the S3 bucket: {selectedService.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <S3LayerSelector
                bucketUrl={selectedService.url}
                capabilities={selectedService.capabilities}
                onObjectSelect={handleS3ObjectSelect}
              />
            </CardContent>
          </Card>
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

export default S3ServiceConfigSection;
