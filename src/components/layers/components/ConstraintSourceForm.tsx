import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Database, Plus, Trash2, Sparkles } from 'lucide-react';
import { Service, ConstraintSourceItem } from '@/types/config';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { ServiceSelectionModal } from './ServiceSelectionModals';
import { ServiceCardList } from './ServiceCardList';
import { populateConstraintFromCogMetadata, validateConstraintSource } from '@/utils/constraintMetadataHelpers';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConstraintSourceFormProps {
  services: Service[];
  onAddConstraintSource: (constraint: ConstraintSourceItem | ConstraintSourceItem[]) => void;
  onAddService: (service: Service) => void;
  onCancel: () => void;
  editingConstraint?: ConstraintSourceItem;
  editingIndex?: number;
}

const ConstraintSourceForm = ({ 
  services, 
  onAddConstraintSource, 
  onAddService, 
  onCancel,
  editingConstraint,
  editingIndex
}: ConstraintSourceFormProps) => {
  const { toast } = useToast();
  const { addService } = useServices(services, onAddService);
  
  // Initialize sourceType based on whether we have an existing URL
  const [sourceType, setSourceType] = useState<'service' | 'direct'>(
    editingConstraint?.url ? 'direct' : 'direct'
  );
  const [directUrl, setDirectUrl] = useState(editingConstraint?.url || '');
  const [label, setLabel] = useState(editingConstraint?.label || '');
  const [interactive, setInteractive] = useState(editingConstraint?.interactive ?? true);
  const [constraintType, setConstraintType] = useState<'continuous' | 'categorical' | 'combined'>(
    editingConstraint?.type || 'continuous'
  );
  
  // Continuous constraint fields
  const [minValue, setMinValue] = useState<string>(editingConstraint?.min?.toString() || '');
  const [maxValue, setMaxValue] = useState<string>(editingConstraint?.max?.toString() || '');
  const [units, setUnits] = useState(editingConstraint?.units || '');
  
  // Categorical constraint fields
  const [constrainToValues, setConstrainToValues] = useState<Array<{ label: string; value: string }>>(
    editingConstraint?.type === 'categorical' && editingConstraint?.constrainTo
      ? editingConstraint.constrainTo.map(c => 'value' in c ? { label: c.label, value: c.value.toString() } : { label: '', value: '' })
      : [{ label: '', value: '' }]
  );
  
  // Combined constraint fields (named ranges)
  const [namedRanges, setNamedRanges] = useState<Array<{ label: string; min: string; max: string }>>(
    editingConstraint?.type === 'combined' && editingConstraint?.constrainTo
      ? editingConstraint.constrainTo.map(c => 'min' in c && 'max' in c 
          ? { label: c.label, min: c.min.toString(), max: c.max.toString() }
          : { label: '', min: '', max: '' })
      : [{ label: '', min: '', max: '' }]
  );
  const [bulkCount, setBulkCount] = useState<string>('');
  const [bulkMin, setBulkMin] = useState<string>('');
  const [bulkMax, setBulkMax] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Modal state for service selection
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // Loading state for metadata fetch
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Reset form when editingConstraint changes (including when switching from edit to add mode)
  useEffect(() => {
    setSourceType(editingConstraint?.url ? 'direct' : 'direct');
    setDirectUrl(editingConstraint?.url || '');
    setLabel(editingConstraint?.label || '');
    setInteractive(editingConstraint?.interactive ?? true);
    setConstraintType(editingConstraint?.type || 'continuous');
    setMinValue(editingConstraint?.min?.toString() || '');
    setMaxValue(editingConstraint?.max?.toString() || '');
    setUnits(editingConstraint?.units || '');
    setConstrainToValues(
      editingConstraint?.type === 'categorical' && editingConstraint?.constrainTo
        ? editingConstraint.constrainTo.map(c => 'value' in c ? { label: c.label, value: c.value.toString() } : { label: '', value: '' })
        : [{ label: '', value: '' }]
    );
    setNamedRanges(
      editingConstraint?.type === 'combined' && editingConstraint?.constrainTo
        ? editingConstraint.constrainTo.map(c => 'min' in c && 'max' in c 
            ? { label: c.label, min: c.min.toString(), max: c.max.toString() }
            : { label: '', min: '', max: '' })
        : [{ label: '', min: '', max: '' }]
    );
    setBulkCount('');
    setBulkMin('');
    setBulkMax('');
  }, [editingConstraint]);

  const handleServiceSelect = (service: Service) => {
    setSelectedServiceForModal(service);
    setShowServiceModal(true);
  };

  const handleServiceModalSelection = (
    selection: string | Array<{ url: string; format: string }>,
    layers: string = ''
  ) => {
    // Handle bulk selection (array of COG assets from S3/STAC)
    if (Array.isArray(selection)) {
      // For bulk add, open a simplified form to configure common properties
      // Then add all constraints at once
      toast({
        title: "Bulk Constraint Addition",
        description: "Bulk constraint addition from services will be available soon.",
      });
      setShowServiceModal(false);
      setSelectedServiceForModal(null);
      return;
    }
    
    // Handle single selection
    const url = selection;
    setDirectUrl(url);
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
  };

  const handleFetchMetadata = async () => {
    // For combined type, show placeholder message
    if (constraintType === 'combined') {
      toast({
        title: "Coming Soon",
        description: "Functionality available in future release",
      });
      return;
    }

    if (!directUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a COG URL before fetching metadata.",
        variant: "destructive"
      });
      return;
    }

    setIsFetchingMetadata(true);
    
    try {
      const suggestions = await populateConstraintFromCogMetadata(directUrl.trim());
      
      // Populate form fields based on suggestions
      setConstraintType(suggestions.type);
      
      if (suggestions.type === 'continuous') {
        if (suggestions.min !== undefined) setMinValue(suggestions.min.toString());
        if (suggestions.max !== undefined) setMaxValue(suggestions.max.toString());
        if (suggestions.units) setUnits(suggestions.units);
      } else {
        if (suggestions.constrainTo && suggestions.constrainTo.length > 0) {
          setConstrainToValues(
            suggestions.constrainTo.map(c => ({ label: c.label, value: c.value.toString() }))
          );
        }
      }
      
      toast({
        title: "Metadata Fetched",
        description: `Successfully populated ${suggestions.type} constraint fields from COG metadata.`,
      });
    } catch (error) {
      toast({
        title: "Metadata Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch COG metadata.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleAddConstrainToValue = () => {
    setConstrainToValues([...constrainToValues, { label: '', value: '' }]);
  };

  const handleRemoveConstrainToValue = (index: number) => {
    setConstrainToValues(constrainToValues.filter((_, i) => i !== index));
  };

  const handleConstrainToChange = (index: number, field: 'label' | 'value', value: string) => {
    const updated = [...constrainToValues];
    updated[index][field] = value;
    setConstrainToValues(updated);
  };

  // Named ranges handlers
  const handleAddNamedRange = () => {
    setNamedRanges([...namedRanges, { label: '', min: '', max: '' }]);
  };

  const handleRemoveNamedRange = (index: number) => {
    setNamedRanges(namedRanges.filter((_, i) => i !== index));
  };

  const handleNamedRangeChange = (index: number, field: 'label' | 'min' | 'max', value: string) => {
    const updated = [...namedRanges];
    updated[index][field] = value;
    setNamedRanges(updated);
  };

  const handleMoveNamedRange = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updated = [...namedRanges];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      setNamedRanges(updated);
    } else if (direction === 'down' && index < namedRanges.length - 1) {
      const updated = [...namedRanges];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      setNamedRanges(updated);
    }
  };

  const handleBulkGenerate = () => {
    const count = parseInt(bulkCount);
    const min = parseFloat(bulkMin);
    const max = parseFloat(bulkMax);
    
    if (isNaN(count) || count <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of ranges",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(min) || isNaN(max) || min >= max) {
      toast({
        title: "Invalid Range",
        description: "Please enter valid min and max values (min < max)",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate interval size
    const totalRange = max - min;
    const intervalSize = Math.floor(totalRange / count);
    
    // Generate ranges with 1-unit gaps (non-overlapping)
    const newRanges: Array<{ label: string; min: string; max: string }> = [];
    
    for (let i = 0; i < count; i++) {
      const rangeMin = min + (i * intervalSize) + (i > 0 ? 1 : 0); // Add 1-unit gap for ranges after the first
      const rangeMax = i === count - 1 
        ? max  // Last range goes to exact max
        : min + ((i + 1) * intervalSize); // Other ranges calculated normally
      
      newRanges.push({
        label: `Range ${i + 1}`,
        min: rangeMin.toString(),
        max: rangeMax.toString()
      });
    }
    
    // APPEND to existing ranges (don't clear)
    setNamedRanges([...namedRanges, ...newRanges]);
    
    // Clear bulk input fields
    setBulkCount('');
    setBulkMin('');
    setBulkMax('');
    
    // Close modal
    setShowBulkModal(false);
    
    toast({
      title: "Ranges Generated",
      description: `Added ${count} ranges. You can now edit the labels.`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = directUrl.trim();
    
    if (!url) {
      toast({
        title: "Missing URL",
        description: "Please provide a COG URL.",
        variant: "destructive"
      });
      return;
    }
    
    if (interactive && !label.trim()) {
      toast({
        title: "Missing Label",
        description: "Please provide a label for interactive constraints.",
        variant: "destructive"
      });
      return;
    }

    // Validation for combined type
    if (constraintType === 'combined') {
      // Filter out completely empty rows
      const validRanges = namedRanges.filter(r => 
        r.label.trim() || r.min.trim() || r.max.trim()
      );
      
      if (validRanges.length === 0) {
        toast({
          title: "Validation Error",
          description: "At least one named range is required",
          variant: "destructive"
        });
        return;
      }
      
      // Validate each non-empty range
      for (let i = 0; i < validRanges.length; i++) {
        const range = validRanges[i];
        const originalIndex = namedRanges.indexOf(range);
        
        if (!range.label.trim()) {
          toast({
            title: "Validation Error",
            description: `Range ${originalIndex + 1}: Label is required`,
            variant: "destructive"
          });
          return;
        }
        
        const min = parseFloat(range.min);
        const max = parseFloat(range.max);
        
        if (isNaN(min) || !range.min.trim()) {
          toast({
            title: "Validation Error",
            description: `Range ${originalIndex + 1}: Min value is required`,
            variant: "destructive"
          });
          return;
        }
        
        if (isNaN(max) || !range.max.trim()) {
          toast({
            title: "Validation Error",
            description: `Range ${originalIndex + 1}: Max value is required`,
            variant: "destructive"
          });
          return;
        }
        
        if (min >= max) {
          toast({
            title: "Validation Error",
            description: `Range ${originalIndex + 1}: Min must be less than Max`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    // Build constraint object based on type
    const baseConstraint: Partial<ConstraintSourceItem> = {
      url,
      format: 'cog',
      label: label.trim(),
      type: constraintType,
      interactive,
      // Preserve bandIndex when editing, otherwise it will be auto-assigned
      ...(editingConstraint?.bandIndex !== undefined && { bandIndex: editingConstraint.bandIndex })
    };

    if (constraintType === 'continuous') {
      const min = parseFloat(minValue);
      const max = parseFloat(maxValue);
      
      if (isNaN(min) || isNaN(max)) {
        toast({
          title: "Invalid Values",
          description: "Min and max values must be valid numbers for continuous constraints.",
          variant: "destructive"
        });
        return;
      }
      
      baseConstraint.min = min;
      baseConstraint.max = max;
      if (units.trim()) {
        baseConstraint.units = units.trim();
      }
    } else if (constraintType === 'categorical') {
      // Categorical
      const parsedConstrainTo = constrainToValues
        .filter(c => c.label.trim() && c.value.trim())
        .map(c => ({
          label: c.label.trim(),
          value: parseInt(c.value.trim())
        }));
      
      if (parsedConstrainTo.length === 0) {
        toast({
          title: "Missing Categories",
          description: "Please provide at least one category with label and value.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for invalid values
      if (parsedConstrainTo.some(c => isNaN(c.value))) {
        toast({
          title: "Invalid Category Values",
          description: "All category values must be valid integers.",
          variant: "destructive"
        });
        return;
      }
      
      baseConstraint.constrainTo = parsedConstrainTo;
    } else if (constraintType === 'combined') {
      // Combined (named ranges) - filter out empty rows
      const validRanges = namedRanges
        .filter(r => r.label.trim() || r.min.trim() || r.max.trim())
        .map(r => ({
          label: r.label.trim(),
          min: parseFloat(r.min),
          max: parseFloat(r.max)
        }));
      
      baseConstraint.constrainTo = validRanges;
      if (units.trim()) {
        baseConstraint.units = units.trim();
      }
    }

    // Validate constraint
    const validation = validateConstraintSource(baseConstraint);
    if (!validation.isValid) {
      toast({
        title: "Validation Failed",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    onAddConstraintSource(baseConstraint as ConstraintSourceItem);
    
    toast({
      title: editingConstraint ? "Constraint Updated" : "Constraint Added",
      description: `${constraintType.charAt(0).toUpperCase() + constraintType.slice(1)} constraint has been ${editingConstraint ? 'updated' : 'added'}.`,
    });
  };

  const cogServices = services.filter(s => s.format === 'cog' || s.sourceType === 's3' || s.sourceType === 'stac');

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
            {editingConstraint ? 'Edit Constraint Source' : 'Add Constraint Source'}
          </CardTitle>
          <CardDescription>
            Constraint sources must be COG format. They define data-driven constraints that can control layer visibility or filtering.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Type Selection */}
            <div className="space-y-6">
              <Label>Source Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    sourceType === 'direct' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSourceType('direct');
                    // Clear directUrl if switching from service to allow manual entry
                    if (sourceType === 'service') {
                      setDirectUrl('');
                    }
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Database className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Direct Connection</div>
                    <div className="text-sm text-muted-foreground">Provide COG URL directly</div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-colors ${
                    sourceType === 'service' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSourceType('service');
                    // Clear directUrl if switching from direct to allow service selection
                    if (sourceType === 'direct') {
                      setDirectUrl('');
                    }
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Database className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">From Service</div>
                    <div className="text-sm text-muted-foreground">Select from S3/STAC</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Service Selection - ONLY show when no URL selected yet */}
            {sourceType === 'service' && !directUrl && (
              <div className="space-y-4">
                <Label>Select a Service (COG, S3, or STAC)</Label>
                <ServiceCardList
                  services={services}
                  onServiceSelect={handleServiceSelect}
                  filterFn={(service) => 
                    service.format === 'cog' || 
                    service.sourceType === 's3' || 
                    service.sourceType === 'stac'
                  }
                  emptyMessage="No COG-compatible services available. Add services via the Services menu."
                />
              </div>
            )}

            {/* Configuration Fields - show for direct OR after service selection */}
            {(sourceType === 'direct' || directUrl) && (
              <>
                {/* Direct URL Input - only for direct connection */}
                {sourceType === 'direct' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">COG URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com/constraint.tif"
                        value={directUrl}
                        onChange={(e) => setDirectUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Band index is automatically managed (starts at 2, increments sequentially).
                      </p>
                    </div>
                  </div>
                )}

                {/* After service selection - show pre-populated URL */}
                {sourceType === 'service' && directUrl && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Selected COG URL</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDirectUrl('')}
                        >
                          Change Source
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/50 border rounded text-sm break-all">
                        {directUrl}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Band index is automatically managed (starts at 2, increments sequentially).
                      </p>
                    </div>
                  </div>
                )}

                {/* Constraint Configuration */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Constraint Configuration</h3>

                  {/* Interactive Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="interactive">Interactive</Label>
                      <Switch
                        id="interactive"
                        checked={interactive}
                        onCheckedChange={setInteractive}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If enabled, users can control this constraint in the viewer interface.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label">
                      {interactive 
                        ? "Label (displayed in Geospatial Explorer UI) *" 
                        : "Label (optional, for reference)"}
                    </Label>
                    <Input
                      id="label"
                      placeholder={interactive 
                        ? "e.g., Temperature, Land Cover Type" 
                        : "Optional label for reference"}
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Constraint Type *</Label>
                    <RadioGroup value={constraintType} onValueChange={(value) => setConstraintType(value as 'continuous' | 'categorical' | 'combined')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="continuous" id="continuous" />
                        <Label htmlFor="continuous" className="font-normal cursor-pointer">
                          Continuous (e.g., temperature, elevation)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="categorical" id="categorical" />
                        <Label htmlFor="categorical" className="font-normal cursor-pointer">
                          Categorical (e.g., land cover classes)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="combined" id="combined" />
                        <Label htmlFor="combined" className="font-normal cursor-pointer">
                          Named Ranges (continuous with labeled ranges)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchMetadata}
                    disabled={!directUrl.trim() || isFetchingMetadata}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isFetchingMetadata 
                      ? 'Fetching...' 
                      : constraintType === 'continuous' 
                        ? 'Populate Min & Max from COG' 
                        : constraintType === 'categorical'
                          ? 'Populate Categories from COG'
                          : 'Populate from COG'}
                  </Button>

                  {/* Continuous Fields */}
                  {constraintType === 'continuous' && (
                    <div className="space-y-4 pl-4 border-l-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min">Min Value *</Label>
                          <Input
                            id="min"
                            type="number"
                            step="any"
                            placeholder="0"
                            value={minValue}
                            onChange={(e) => setMinValue(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max">Max Value *</Label>
                          <Input
                            id="max"
                            type="number"
                            step="any"
                            placeholder="100"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="units">Units</Label>
                          <Input
                            id="units"
                            placeholder="e.g., °C, meters, km/h"
                            value={units}
                            onChange={(e) => setUnits(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {interactive 
                          ? "Min and max values are used as the range for the interactive constraint slider"
                          : "Min and max values are the range across which the primary layer is visible"}
                      </p>
                    </div>
                  )}

                  {/* Categorical Fields */}
                  {constraintType === 'categorical' && (
                    <div className="space-y-4 pl-4 border-l-2">
                      <Label>Categories *</Label>
                      {constrainToValues.map((category, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Label"
                            value={category.label}
                            onChange={(e) => handleConstrainToChange(index, 'label', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            type="number"
                            value={category.value}
                            onChange={(e) => handleConstrainToChange(index, 'value', e.target.value)}
                            className="w-24"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveConstrainToValue(index)}
                            disabled={constrainToValues.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        {interactive 
                          ? "Categories listed above are presented as check boxes which the user can select / deselect to control what areas are visible on the primary layer. Areas covered by categories excluded from the above list, will not be visible on the primary layer."
                          : "Only locations covered by categories included above will be visible on the primary layer."}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddConstrainToValue}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  )}

                  {/* Named Ranges (Combined) Fields */}
                  {constraintType === 'combined' && (
                    <div className="space-y-4 pl-4 border-l-2">
                      <div>
                        <Label htmlFor="units">Units</Label>
                        <Input
                          id="units"
                          value={units}
                          onChange={(e) => setUnits(e.target.value)}
                          placeholder="e.g., meters, degrees, percentage"
                        />
                      </div>

                      {/* Named Ranges Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Named Ranges ({namedRanges.length})</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowBulkModal(true)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Bulk Add
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddNamedRange}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Another
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted sticky top-0">
                                <tr>
                                  <th className="text-left p-2 font-medium" style={{ width: '50%' }}>Label</th>
                                  <th className="text-left p-2 font-medium w-32">Min</th>
                                  <th className="text-left p-2 font-medium w-32">Max</th>
                                  <th className="text-right p-2 font-medium w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {namedRanges.map((range, index) => (
                                  <tr key={index} className="border-t hover:bg-muted/30">
                                    <td className="p-2" style={{ width: '50%' }}>
                                      <Input
                                        value={range.label}
                                        onChange={(e) => handleNamedRangeChange(index, 'label', e.target.value)}
                                        placeholder="Range label"
                                        className="h-8 text-sm"
                                      />
                                    </td>
                                    <td className="p-2 w-32">
                                      <Input
                                        type="number"
                                        value={range.min}
                                        onChange={(e) => handleNamedRangeChange(index, 'min', e.target.value)}
                                        onBlur={() => {
                                          const min = parseFloat(range.min);
                                          const max = parseFloat(range.max);
                                          if (!isNaN(min) && !isNaN(max) && min >= max) {
                                            toast({
                                              title: "Invalid Range",
                                              description: `Range ${index + 1}: Min must be less than Max`,
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                        placeholder="Min"
                                        className="h-8 text-sm"
                                      />
                                    </td>
                                    <td className="p-2 w-32">
                                      <Input
                                        type="number"
                                        value={range.max}
                                        onChange={(e) => handleNamedRangeChange(index, 'max', e.target.value)}
                                        onBlur={() => {
                                          const min = parseFloat(range.min);
                                          const max = parseFloat(range.max);
                                          if (!isNaN(min) && !isNaN(max) && min >= max) {
                                            toast({
                                              title: "Invalid Range",
                                              description: `Range ${index + 1}: Min must be less than Max`,
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                        placeholder="Max"
                                        className="h-8 text-sm"
                                      />
                                    </td>
                                    <td className="p-2 w-24">
                                      <div className="flex gap-1 justify-end">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMoveNamedRange(index, 'up')}
                                          disabled={index === 0}
                                          className="h-6 w-6 p-0"
                                        >
                                          ↑
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMoveNamedRange(index, 'down')}
                                          disabled={index === namedRanges.length - 1}
                                          className="h-6 w-6 p-0"
                                        >
                                          ↓
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveNamedRange(index)}
                                          className="h-6 w-6 p-0 text-destructive"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingConstraint ? 'Update Constraint' : 'Add Constraint'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Generation Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Ranges</DialogTitle>
            <DialogDescription>
              Generate multiple equal-interval ranges automatically. Ranges will be non-overlapping with 1-unit gaps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulkCount">Number of Ranges</Label>
              <Input
                id="bulkCount"
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                placeholder="e.g., 10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulkMin">From</Label>
                <Input
                  id="bulkMin"
                  type="number"
                  value={bulkMin}
                  onChange={(e) => setBulkMin(e.target.value)}
                  placeholder="e.g., 0"
                />
              </div>
              <div>
                <Label htmlFor="bulkMax">To</Label>
                <Input
                  id="bulkMax"
                  type="number"
                  value={bulkMax}
                  onChange={(e) => setBulkMax(e.target.value)}
                  placeholder="e.g., 10000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkGenerate}
            >
              Generate Ranges
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConstraintSourceForm;
