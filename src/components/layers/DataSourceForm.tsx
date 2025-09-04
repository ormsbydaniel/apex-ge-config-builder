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
import { Save, X, Database, Globe, Plus, Server, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Service, DataSourceFormat, DataSourceItem, TimeframeType } from '@/types/config';
import { FORMAT_CONFIGS } from '@/constants/formats';
import { useServices } from '@/hooks/useServices';
import { useStatisticsLayer } from '@/hooks/useStatisticsLayer';
import { useToast } from '@/hooks/use-toast';
import { LayerTypeOption } from '@/hooks/useLayerOperations';
import { PositionValue, getValidPositions, getPositionDisplayName, requiresPosition, getDefaultPosition } from '@/utils/positionUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ServiceSelectionModal } from './components/ServiceSelectionModals';

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
  const [directUrl, setDirectUrl] = useState('');
  const [directLayers, setDirectLayers] = useState('');
  const [zIndex, setZIndex] = useState(2);
  
  // Modal state for service selection
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
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
  const [month, setMonth] = useState<Date>(new Date());
  const requiresTimestamp = timeframe && timeframe !== 'None';

  // Generate year options (1900 to 2050)
  const yearOptions = Array.from({ length: 151 }, (_, i) => 1900 + i);
  
  // Month names
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month.getFullYear(), parseInt(monthIndex), 1);
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(parseInt(year), month.getMonth(), 1);
    setMonth(newMonth);
  };

  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    return (
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const config_format = FORMAT_CONFIGS[selectedFormat];
  const needsPosition = requiresPosition(layerType);
  const validPositions = getValidPositions(layerType);

  // Check if current format supports statistics
  const supportsStatistics = selectedFormat === 'flatgeobuf' || selectedFormat === 'geojson';

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
    setSelectedServiceForModal(service);
    setShowServiceModal(true);
  };

  const handleServiceModalSelection = (url: string, layers: string = '', format?: DataSourceFormat) => {
    // Populate the direct connection form with the selected data
    setDirectUrl(url);
    setDirectLayers(layers);
    if (format) {
      setSelectedFormat(format);
    }
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!directUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a data source URL.",
        variant: "destructive"
      });
      return;
    }
    
    const url = directUrl.trim();
    const layers = directLayers.trim();
    
    if (config_format.requiresLayers && !layers) {
      toast({
        title: "Missing Layers",
        description: "Please provide layer information.",
        variant: "destructive"
      });
      return;
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

    // Validate timestamp for temporal layers
    if (requiresTimestamp && !selectedDate) {
      toast({
        title: "Missing Timestamp",
        description: "Please select a timestamp for this temporal layer.",
        variant: "destructive"
      });
      return;
    }

    const dataSourceItem: DataSourceItem = {
      url,
      format: selectedFormat,
      zIndex,
      ...(layers && { layers }),
      ...(needsPosition && selectedPosition && { position: selectedPosition }),
      ...(isStatisticsLayer && supportsStatistics && { level: statisticsLevel }),
      ...(requiresTimestamp && selectedDate && { timestamps: [Math.floor(selectedDate.getTime() / 1000)] })
    };

    // Call appropriate callback based on statistics layer flag
    if (isStatisticsLayer && supportsStatistics) {
      onAddStatisticsLayer(dataSourceItem);
      toast({
        title: "Statistics Layer Added",
        description: `${selectedFormat.toUpperCase()} statistics layer (level ${statisticsLevel}) has been added.`,
      });
    } else {
      onAddDataSource(dataSourceItem);
      toast({
        title: "Data Source Added",
        description: `${selectedFormat.toUpperCase()} data source has been added to the layer.`,
      });
    }
  };

  return (
    <>
      <ServiceSelectionModal 
        service={selectedServiceForModal}
        isOpen={showServiceModal}
        onClose={handleServiceModalClose}
        onSelect={handleServiceModalSelection}
      />
      
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

            {/* Service Selection */}
            {sourceType === 'service' && !directUrl && (
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
                    <Card key={service.id} className={`border-l-4 ${
                      service.sourceType === 's3' ? 'border-l-green-500' : 
                      service.sourceType === 'stac' ? 'border-l-purple-500' : 
                      'border-l-blue-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {service.sourceType === 's3' ? (
                                <Database className="h-4 w-4 text-green-600" />
                              ) : service.sourceType === 'stac' ? (
                                <Server className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Globe className="h-4 w-4 text-blue-600" />
                              )}
                              <h3 className={`font-medium ${
                                service.sourceType === 's3' ? 'text-green-700' : 
                                service.sourceType === 'stac' ? 'text-purple-700' : 
                                'text-blue-700'
                              }`}>{service.name}</h3>
                              <Badge variant="outline" className={`${
                                service.sourceType === 's3' ? 'border-green-300 text-green-700' : 
                                service.sourceType === 'stac' ? 'border-purple-300 text-purple-700' : 
                                'border-blue-300 text-blue-700'
                              }`}>
                                {service.sourceType === 's3' ? 'S3 Bucket' : 
                                 service.sourceType === 'stac' ? 'STAC' : 
                                 service.format?.toUpperCase()}
                              </Badge>
                              {service.capabilities?.layers.length && (
                                <Badge variant="outline" className="border-green-300 text-green-700">
                                  {service.capabilities.layers.length} {
                                    service.sourceType === 's3' ? 'objects' : 
                                    service.sourceType === 'stac' ? 'collections' : 
                                    'layers'
                                  } available
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
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                            month={month}
                            onMonthChange={setMonth}
                            initialFocus
                            className={cn("p-0 pointer-events-auto")}
                            components={{
                              Caption: CustomCaption
                            }}
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

            {/* Service-populated Direct Configuration */}
            {sourceType === 'service' && directUrl && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Configuration populated from selected service. You can modify the details below if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDirectFormat">Data Format *</Label>
                  <Select value={selectedFormat} onValueChange={handleFormatChange}>
                    <SelectTrigger id="serviceDirectFormat">
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

                {/* Statistics Layer Toggle */}
                {supportsStatistics && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="serviceDirectStatisticsLayer"
                        name="serviceDirectStatisticsLayer"
                        checked={isStatisticsLayer}
                        onCheckedChange={handleStatisticsToggle}
                      />
                      <Label htmlFor="serviceDirectStatisticsLayer" className="font-medium">
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
                  <Label htmlFor="serviceDirectUrl">Data Source URL *</Label>
                  <Input
                    id="serviceDirectUrl"
                    name="serviceDirectUrl"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder={config_format.urlPlaceholder}
                    autoComplete="url"
                  />
                </div>
                
                {config_format.requiresLayers && (
                  <div className="space-y-2">
                    <Label htmlFor="serviceDirectLayers">Layer Name *</Label>
                    <Input
                      id="serviceDirectLayers"
                      name="serviceDirectLayers"
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
                    <div className="space-y-2">
                      <Label htmlFor="serviceTimestamp" className="text-sm font-medium text-blue-700 dark:text-blue-300">
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
                            month={month}
                            onMonthChange={setMonth}
                            initialFocus
                            className={cn("p-0 pointer-events-auto")}
                            components={{
                              Caption: CustomCaption
                            }}
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
                  <Label htmlFor="serviceDirectZIndex">Z-Index</Label>
                  <Input
                    id="serviceDirectZIndex"
                    name="serviceDirectZIndex"
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
              {((sourceType === 'direct' && directUrl) || (sourceType === 'service' && directUrl)) && (
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Finish
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default DataSourceForm;