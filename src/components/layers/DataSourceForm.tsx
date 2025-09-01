
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Save, X, Database, Globe, Plus, ArrowLeft, CalendarIcon } from 'lucide-react';
import { Service, DataSourceFormat, DataSourceItem, TimeframeType } from '@/types/config';
import { FORMAT_CONFIGS } from '@/constants/formats';
import { useServices } from '@/hooks/useServices';
import { useStatisticsLayer } from '@/hooks/useStatisticsLayer';
import { useToast } from '@/hooks/use-toast';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
import { PositionValue, getValidPositions, getPositionDisplayName, requiresPosition, getDefaultPosition } from '@/utils/positionUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { validateS3Url, S3Object, getFormatFromExtension } from '@/utils/s3Utils';
import S3LayerSelector from '@/components/form/S3LayerSelector';

interface DataSourceFormProps {
  services: Service[];
  currentLayerStatistics?: DataSourceItem[];
  layerType?: LayerTypeOption;
  timeframe?: TimeframeType;
  onAddDataSource: (dataSource: DataSourceItem) => void;
  onAddStatisticsLayer: (statisticsItem: DataSourceItem) => void;
  onAddService: (service: Service) => void;
  onCancel: () => void;
}

const DataSourceForm = ({ 
  services, 
  currentLayerStatistics = [],
  layerType = 'standard',
  timeframe = 'None',
  onAddDataSource, 
  onAddStatisticsLayer,
  onAddService, 
  onCancel 
}: DataSourceFormProps) => {
  const { toast } = useToast();
  const { addService, isLoadingCapabilities } = useServices(services, onAddService);
  
  const [sourceType, setSourceType] = useState<'service' | 'direct'>('direct');
  const [selectedFormat, setSelectedFormat] = useState<DataSourceFormat>('cog');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedLayer, setSelectedLayer] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [directLayers, setDirectLayers] = useState('');
  const [zIndex, setZIndex] = useState(2);
  const [showLayerSelection, setShowLayerSelection] = useState(false);
  
  // Position state for comparison layers
  const [selectedPosition, setSelectedPosition] = useState<PositionValue | undefined>(
    requiresPosition(layerType) ? getDefaultPosition(layerType) : undefined
  );
  
  // Statistics layer state
  const {
    isStatisticsLayer,
    setIsStatisticsLayer,
    statisticsLevel
  } = useStatisticsLayer(currentLayerStatistics);
  
  // New service form
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceUrl, setNewServiceUrl] = useState('');
  
  // Date picker state for temporal layers
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const requiresTimestamp = timeframe && timeframe !== 'None';
  
  // S3 object selection state
  const [selectedS3Object, setSelectedS3Object] = useState<S3Object | null>(null);
  const [detectedS3Format, setDetectedS3Format] = useState<DataSourceFormat | null>(null);
  
  // Check if selected layer has TIME dimension
  const selectedLayerInfo = selectedService?.capabilities?.layers.find(layer => layer.name === selectedLayer);
  const hasServiceTimeDimension = selectedLayerInfo?.hasTimeDimension;

  const config_format = FORMAT_CONFIGS[selectedFormat];
  const needsPosition = requiresPosition(layerType);
  const validPositions = getValidPositions(layerType);

  // Check if current format supports statistics
  const effectiveFormat = detectedS3Format || selectedFormat;
  const supportsStatistics = effectiveFormat === 'flatgeobuf' || effectiveFormat === 'geojson';
  
  // Check if selected service is S3
  const isS3Service = selectedService && (selectedService.sourceType === 's3' || validateS3Url(selectedService.url));

  const handleFormatChange = (format: DataSourceFormat) => {
    setSelectedFormat(format);
    
    // Reset statistics state for unsupported formats
    if (format !== 'flatgeobuf' && format !== 'geojson') {
      setIsStatisticsLayer(false);
    }
  };

  const handleStatisticsToggle = (checked: boolean) => {
    setIsStatisticsLayer(checked);
  };

  const handleAddNewService = async () => {
    if (newServiceName.trim() && newServiceUrl.trim()) {
      await addService(newServiceName, newServiceUrl, selectedFormat);
      setNewServiceName('');
      setNewServiceUrl('');
      setShowNewServiceForm(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedFormat(service.format as DataSourceFormat);
    setShowLayerSelection(true);
    setSelectedLayer('');
  };

  const handleBackToServices = () => {
    setShowLayerSelection(false);
    setSelectedService(null);
    setSelectedLayer('');
    setSelectedS3Object(null);
    setDetectedS3Format(null);
  };

  const handleS3ObjectSelect = (object: S3Object, detectedFormat: DataSourceFormat) => {
    setSelectedS3Object(object);
    setDetectedS3Format(detectedFormat);
    setDirectUrl(object.url);
    
    toast({
      title: "S3 Object Selected",
      description: `Selected ${object.key} (detected as ${detectedFormat.toUpperCase()})`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let url = '';
    let layers = '';
    let serviceId = undefined;

    if (sourceType === 'service') {
      if (!selectedService) {
        toast({
          title: "Missing Service",
          description: "Please select a service.",
          variant: "destructive"
        });
        return;
      }
      
      // For S3 services, use the selected object URL if available
      if (isS3Service && selectedS3Object) {
        url = selectedS3Object.url;
        // Don't set serviceId for S3 objects, as they're direct file URLs
      } else {
        url = selectedService.url;
        serviceId = selectedService.id;
      }
      
      const serviceConfig = FORMAT_CONFIGS[selectedService.format as DataSourceFormat];
      // Skip layer validation for S3 services
      if (!isS3Service && serviceConfig.requiresLayers && !selectedLayer) {
        toast({
          title: "Missing Layer",
          description: "Please select a layer.",
          variant: "destructive"
        });
        return;
      }
      
      // For S3 services, validate that an object is selected
      if (isS3Service && !selectedS3Object) {
        toast({
          title: "Missing S3 Object",
          description: "Please select a file from the S3 bucket.",
          variant: "destructive"
        });
        return;
      }
      
      layers = selectedLayer;
    } else {
      if (!directUrl.trim()) {
        toast({
          title: "Missing URL",
          description: "Please provide a data source URL.",
          variant: "destructive"
        });
        return;
      }
      url = directUrl.trim();
      
      if (config_format.requiresLayers && !directLayers.trim()) {
        toast({
          title: "Missing Layers",
          description: "Please provide layer information.",
          variant: "destructive"
        });
        return;
      }
      layers = directLayers.trim();
    }

    // Validate position for comparison layers
    if (needsPosition && !selectedPosition) {
      toast({
        title: "Missing Position",
        description: `Please select a position for this ${layerType} layer data source.`,
        variant: "destructive"
      });
      return;
    }

    // Validate statistics layer requirements
    if (isStatisticsLayer && !supportsStatistics) {
      toast({
        title: "Invalid Statistics Layer",
        description: "Statistics layers are only supported for FlatGeoBuf and GeoJSON formats.",
        variant: "destructive"
      });
      return;
    }

    // Validate timestamp for temporal layers (only if no service TIME dimension)
    if (requiresTimestamp && !hasServiceTimeDimension && !selectedDate) {
      toast({
        title: "Missing Timestamp",
        description: "Please select a timestamp for this temporal layer.",
        variant: "destructive"
      });
      return;
    }

    const finalFormat = sourceType === 'service' && isS3Service && detectedS3Format 
      ? detectedS3Format 
      : (sourceType === 'service' ? selectedService!.format : selectedFormat);

    const dataSourceItem: DataSourceItem = {
      url,
      format: finalFormat,
      zIndex,
      ...(layers && { layers }),
      ...(serviceId && { serviceId }),
      ...(needsPosition && selectedPosition && { position: selectedPosition }),
      ...(isStatisticsLayer && supportsStatistics && { level: statisticsLevel }),
      ...(requiresTimestamp && !hasServiceTimeDimension && selectedDate && { timestamps: [Math.floor(selectedDate.getTime() / 1000)] })
    };

    // Call appropriate callback based on statistics layer flag
    if (isStatisticsLayer && supportsStatistics) {
      onAddStatisticsLayer(dataSourceItem);
      toast({
        title: "Statistics Layer Added",
        description: `${(sourceType === 'service' ? selectedService!.format : selectedFormat).toUpperCase()} statistics layer (level ${statisticsLevel}) has been added.`,
      });
    } else {
      onAddDataSource(dataSourceItem);
      toast({
        title: "Data Source Added",
        description: `${(sourceType === 'service' ? selectedService!.format : selectedFormat).toUpperCase()} data source has been added to the layer.`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Add Data Source
          {needsPosition && (
            <Badge variant="outline" className="text-xs">
              {layerType} layer
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure a data source for this layer from an existing service or provide direct connection details.
          {needsPosition && (
            <span className="block mt-1 text-orange-600">
              Position assignment is required for {layerType} layers.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position Selection for Comparison Layers */}
          {needsPosition && (
            <div className="space-y-2 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <Label htmlFor="position" className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Position *
              </Label>
              <Select value={selectedPosition} onValueChange={(value) => setSelectedPosition(value as PositionValue)}>
                <SelectTrigger id="position" className="border-orange-200 dark:border-orange-800">
                  <SelectValue placeholder="Select position for this data source" />
                </SelectTrigger>
                <SelectContent>
                  {validPositions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {getPositionDisplayName(position)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                This data source will be positioned as "{selectedPosition ? getPositionDisplayName(selectedPosition) : 'None'}" in the {layerType} layer.
              </p>
            </div>
          )}

          {/* Source Type Selection */}
          <div className="space-y-4">
            <Label>Source Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-colors ${
                  sourceType === 'direct' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSourceType('direct')}
              >
                <CardContent className="p-4 text-center">
                  <Database className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Direct Connection</div>
                  <div className="text-sm text-muted-foreground">Provide URL directly</div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-colors ${
                  sourceType === 'service' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSourceType('service')}
              >
                <CardContent className="p-4 text-center">
                  <Globe className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">From Service</div>
                  <div className="text-sm text-muted-foreground">Use configured service</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Service-based Configuration */}
          {sourceType === 'service' && (
            <div className="space-y-4">
              {!showLayerSelection ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Select Service</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewServiceForm(!showNewServiceForm)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Service
                      </Button>
                    </div>

                    {showNewServiceForm && (
                      <Card className="border-primary/30">
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newServiceFormat">Data Format</Label>
                            <Select value={selectedFormat} onValueChange={handleFormatChange}>
                              <SelectTrigger id="newServiceFormat">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(FORMAT_CONFIGS).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Statistics Layer Toggle for New Service */}
                          {supportsStatistics && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="newServiceStatisticsLayer"
                                  name="newServiceStatisticsLayer"
                                  checked={isStatisticsLayer}
                                  onCheckedChange={handleStatisticsToggle}
                                />
                                <Label htmlFor="newServiceStatisticsLayer" className="font-medium">
                                  Statistics Layer
                                </Label>
                              </div>
                              
                              {isStatisticsLayer && (
                                <div className="space-y-2">
                                  <Label>Level (Auto-assigned)</Label>
                                  <div className="p-2 bg-muted/50 border rounded text-sm">
                                    Level {statisticsLevel}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="newServiceName">Service Name</Label>
                              <Input
                                id="newServiceName"
                                name="newServiceName"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                placeholder="e.g., My WMS Service"
                                autoComplete="organization"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newServiceUrl">Service URL</Label>
                              <Input
                                id="newServiceUrl"
                                name="newServiceUrl"
                                value={newServiceUrl}
                                onChange={(e) => setNewServiceUrl(e.target.value)}
                                placeholder={FORMAT_CONFIGS[selectedFormat].urlPlaceholder}
                                autoComplete="url"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleAddNewService}
                              disabled={!newServiceName.trim() || !newServiceUrl.trim() || isLoadingCapabilities}
                              size="sm"
                            >
                              Add Service
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewServiceForm(false)}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid gap-4">
                      {services.map((service) => (
                        <Card key={service.id} className="border-primary/20 hover:border-primary/40 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium">{service.name}</h3>
                                  <Badge variant="outline">{service.format.toUpperCase()}</Badge>
                                  {service.capabilities?.layers.length && (
                                    <Badge variant="secondary">
                                      {service.capabilities.layers.length} layers
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{service.url}</p>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleServiceSelect(service)}
                                size="sm"
                                className="ml-4"
                              >
                                Add Layer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBackToServices}
                        size="sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Services
                      </Button>
                    </div>

                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{selectedService?.name}</h3>
                          <Badge variant="outline">{selectedService?.format.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedService?.url}</p>
                        {isS3Service && (
                          <Badge variant="secondary" className="mt-2">S3 Bucket</Badge>
                        )}
                      </CardContent>
                    </Card>

                    {/* S3 File Browser */}
                    {isS3Service ? (
                      <div className="space-y-4">
                        {selectedS3Object && detectedS3Format && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700">
                              <span className="font-medium">Selected:</span>
                              <span>{selectedS3Object.key}</span>
                              <span className="text-sm">({detectedS3Format.toUpperCase()})</span>
                            </div>
                          </div>
                        )}
                        
                        <S3LayerSelector
                          bucketUrl={selectedService.url}
                          onObjectSelect={handleS3ObjectSelect}
                        />
                      </div>
                    ) : selectedService && FORMAT_CONFIGS[selectedService.format as DataSourceFormat].requiresLayers && (
                      <div className="space-y-2">
                        <Label htmlFor="selectedLayer">Select Layer *</Label>
                        {selectedService.capabilities?.layers.length ? (
                          <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                            <SelectTrigger id="selectedLayer">
                              <SelectValue placeholder="Select layer" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {selectedService.capabilities.layers.map((layer) => (
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
                          <Input
                            id="selectedLayer"
                            name="selectedLayer"
                            value={selectedLayer}
                            onChange={(e) => setSelectedLayer(e.target.value)}
                            placeholder={FORMAT_CONFIGS[selectedService.format as DataSourceFormat].layersPlaceholder}
                            autoComplete="off"
                          />
                        )}
                      </div>
                    )}

                    {/* Statistics Layer Toggle for Service Layer Selection */}
                    {supportsStatistics && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="serviceStatisticsLayer"
                            name="serviceStatisticsLayer"
                            checked={isStatisticsLayer}
                            onCheckedChange={handleStatisticsToggle}
                          />
                          <Label htmlFor="serviceStatisticsLayer" className="font-medium">
                            Statistics Layer
                          </Label>
                        </div>
                        
                        {isStatisticsLayer && (
                          <div className="space-y-2">
                            <Label>Level (Auto-assigned)</Label>
                            <div className="p-2 bg-muted/50 border rounded text-sm">
                              Level {statisticsLevel}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Timestamp Picker for Temporal Layers */}
                    {requiresTimestamp && (
                      <div className="space-y-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        {hasServiceTimeDimension ? (
                          // Show informational message when service layer has TIME dimension
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Time Configuration
                            </Label>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                ✓ Timestamps will be determined from TIME parameter on the source data
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Show date picker when no TIME dimension
                          <div className="space-y-2">
                            <Label htmlFor="timestamp" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Timestamp *
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal border-blue-200 dark:border-blue-800",
                                    !selectedDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              This timestamp will be used for temporal data visualization ({timeframe} timeframe).
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="serviceZIndex">Z-Index</Label>
                      <Input
                        id="serviceZIndex"
                        name="serviceZIndex"
                        type="number"
                        value={zIndex}
                        onChange={(e) => setZIndex(parseInt(e.target.value) || 2)}
                        min="0"
                        max="100"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Direct Configuration */}
          {sourceType === 'direct' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="directFormat">Data Format *</Label>
                <Select value={selectedFormat} onValueChange={handleFormatChange}>
                  <SelectTrigger id="directFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMAT_CONFIGS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statistics Layer Toggle for Direct Configuration */}
              {supportsStatistics && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="directStatisticsLayer"
                      name="directStatisticsLayer"
                      checked={isStatisticsLayer}
                      onCheckedChange={handleStatisticsToggle}
                    />
                    <Label htmlFor="directStatisticsLayer" className="font-medium">
                      Statistics Layer
                    </Label>
                  </div>
                  
                  {isStatisticsLayer && (
                    <div className="space-y-2">
                      <Label>Level (Auto-assigned)</Label>
                      <div className="p-2 bg-muted/50 border rounded text-sm">
                        Level {statisticsLevel}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="directUrl">Data Source URL *</Label>
                <Input
                  id="directUrl"
                  name="directUrl"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder={config_format.urlPlaceholder}
                  autoComplete="url"
                />
              </div>
              
              {config_format.requiresLayers && (
                <div className="space-y-2">
                  <Label htmlFor="directLayers">Layer Name *</Label>
                  <Input
                    id="directLayers"
                    name="directLayers"
                    value={directLayers}
                    onChange={(e) => setDirectLayers(e.target.value)}
                    placeholder={config_format.layersPlaceholder}
                    autoComplete="off"
                  />
                </div>
              )}
              
              {/* Timestamp Picker for Temporal Layers */}
              {requiresTimestamp && (
                <div className="space-y-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  {/* Direct connections always show date picker since they don't have service TIME dimensions */}
                  <div className="space-y-2">
                    <Label htmlFor="timestamp" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Timestamp *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-blue-200 dark:border-blue-800",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      This timestamp will be used for temporal data visualization ({timeframe} timeframe).
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="directZIndex">Z-Index</Label>
                <Input
                  id="directZIndex"
                  name="directZIndex"
                  type="number"
                  value={zIndex}
                  onChange={(e) => setZIndex(parseInt(e.target.value) || 2)}
                  min="0"
                  max="100"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {(sourceType === 'direct' || (sourceType === 'service' && showLayerSelection && (!isS3Service || selectedS3Object))) && (
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4 mr-2" />
                Add {isStatisticsLayer ? 'Statistics Layer' : 'Data Source'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DataSourceForm;
