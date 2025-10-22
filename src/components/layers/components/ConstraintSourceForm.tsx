import React, { useState } from 'react';
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
  const [constraintType, setConstraintType] = useState<'continuous' | 'categorical'>(
    editingConstraint?.type || 'continuous'
  );
  
  // Continuous constraint fields
  const [minValue, setMinValue] = useState<string>(editingConstraint?.min?.toString() || '');
  const [maxValue, setMaxValue] = useState<string>(editingConstraint?.max?.toString() || '');
  const [units, setUnits] = useState(editingConstraint?.units || '');
  
  // Categorical constraint fields
  const [constrainToValues, setConstrainToValues] = useState<Array<{ label: string; value: string }>>(
    editingConstraint?.constrainTo?.map(c => ({ label: c.label, value: c.value.toString() })) || [{ label: '', value: '' }]
  );
  
  // Modal state for service selection
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // Loading state for metadata fetch
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

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
    
    if (!label.trim()) {
      toast({
        title: "Missing Label",
        description: "Please provide a label for this constraint.",
        variant: "destructive"
      });
      return;
    }

    // Build constraint object based on type
    const baseConstraint: Partial<ConstraintSourceItem> = {
      url,
      format: 'cog',
      label: label.trim(),
      type: constraintType,
      interactive,
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
      baseConstraint.units = units.trim();
    } else {
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
                    </div>
                  </div>
                )}

                {/* Interactive Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
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

                {/* Constraint Configuration */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Constraint Configuration</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label">Label *</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Temperature, Land Cover Type"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Constraint Type *</Label>
                    <RadioGroup value={constraintType} onValueChange={(value) => setConstraintType(value as 'continuous' | 'categorical')}>
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
                    {isFetchingMetadata ? 'Fetching...' : 'Fetch COG Metadata & Auto-populate'}
                  </Button>

                  {/* Continuous Fields */}
                  {constraintType === 'continuous' && (
                    <div className="space-y-4 pl-4 border-l-2">
                      <div className="grid grid-cols-2 gap-4">
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
    </>
  );
};

export default ConstraintSourceForm;
