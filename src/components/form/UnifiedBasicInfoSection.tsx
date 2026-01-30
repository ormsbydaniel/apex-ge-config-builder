
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TemporalConfigSection from './TemporalConfigSection';
import { TimeframeType } from '@/types/config';

interface UnifiedBasicInfoSectionProps {
  // Basic fields
  name: string;
  description: string;
  interfaceGroup: string;
  interfaceGroups: string[];
  
  // Optional fields for regular layers
  hasFeatureStatistics?: boolean;
  units?: string;
  isActive?: boolean;
  toggleable?: boolean;
  timeframe?: TimeframeType;
  defaultTimestamp?: number;
  
  // Sub-interface group (optional)
  subinterfaceGroup?: string;
  availableSubinterfaceGroups?: string[];
  showSubinterfaceGroup?: boolean;
  
  // Update handler that supports both flat and nested field paths
  onUpdate: (field: string, value: any) => void;
  
  // Configuration
  showFeatureStatistics?: boolean;
  showUnits?: boolean;
  showIsActive?: boolean;
  showToggleable?: boolean;
  required?: {
    name?: boolean;
    interfaceGroup?: boolean;
  };
}

const UnifiedBasicInfoSection = ({
  name,
  description,
  interfaceGroup,
  interfaceGroups,
  hasFeatureStatistics = false,
  units = '',
  isActive = false,
  toggleable = false,
  timeframe,
  defaultTimestamp,
  subinterfaceGroup = '',
  availableSubinterfaceGroups = [],
  showSubinterfaceGroup = false,
  onUpdate,
  showFeatureStatistics = false,
  showUnits = false,
  showIsActive = false,
  showToggleable = false,
  required = { name: true, interfaceGroup: true }
}: UnifiedBasicInfoSectionProps) => {
  const [showNewSubGroupInput, setShowNewSubGroupInput] = useState(false);
  const [newSubGroupName, setNewSubGroupName] = useState('');
  const [subGroupError, setSubGroupError] = useState('');

  const handleCreateSubGroup = () => {
    setSubGroupError('');
    
    if (!newSubGroupName.trim()) {
      setSubGroupError('Name is required');
      return;
    }
    
    if (availableSubinterfaceGroups.includes(newSubGroupName.trim())) {
      setSubGroupError('This sub-group already exists');
      return;
    }
    
    onUpdate('subinterfaceGroup', newSubGroupName.trim());
    setNewSubGroupName('');
    setShowNewSubGroupInput(false);
  };

  const handleSubGroupChange = (value: string) => {
    if (value === '__none__') {
      onUpdate('subinterfaceGroup', '');
    } else if (value === '__create_new__') {
      setShowNewSubGroupInput(true);
    } else {
      onUpdate('subinterfaceGroup', value);
    }
  };

  return (
    <div className="space-y-4">
      {(showToggleable || showIsActive) && (
        <div className="flex items-center gap-6">
          {showToggleable && (
            <div className="flex items-center justify-between space-x-2 min-w-[140px]">
              <Label htmlFor="toggleable" className="min-w-[70px]">Toggleable:</Label>
              <Switch
                id="toggleable"
                checked={toggleable}
                onCheckedChange={(checked) => onUpdate('toggleable', checked)}
              />
            </div>
          )}
          
          {showIsActive && (
            <div className="flex items-center justify-between space-x-2 min-w-[160px]">
              <Label htmlFor="isActive">Active by default:</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => onUpdate('isActive', checked)}
              />
            </div>
          )}
        </div>
      )}
      
      <h3 className="text-lg font-medium">Basic Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Layer Name {required.name && '*'}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="e.g., Winter Cereals 2021"
            required={required.name}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="interfaceGroup">
            Interface Group {required.interfaceGroup && '*'}
          </Label>
          <Select
            value={interfaceGroup}
            onValueChange={(value) => onUpdate('interfaceGroup', value)}
            required={required.interfaceGroup}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an interface group" />
            </SelectTrigger>
            <SelectContent>
              {interfaceGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sub-Interface Group dropdown */}
      {showSubinterfaceGroup && (
        <div className="space-y-2">
          <Label htmlFor="subinterfaceGroup">Sub-Interface Group (optional)</Label>
          <Popover open={showNewSubGroupInput} onOpenChange={setShowNewSubGroupInput}>
            <div className="flex gap-2">
              <Select
                value={subinterfaceGroup || '__none__'}
                onValueChange={handleSubGroupChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a sub-group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">(none)</SelectItem>
                  {availableSubinterfaceGroups.map((subGroup) => (
                    <SelectItem key={subGroup} value={subGroup}>
                      {subGroup}
                    </SelectItem>
                  ))}
                  <SelectItem value="__create_new__" className="text-amber-600">
                    <span className="flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      Create new sub-group
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  title="Create new sub-group"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </div>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Create New Sub-Group</h4>
                <p className="text-xs text-muted-foreground">
                  This sub-group will be created within "{interfaceGroup || 'the selected interface group'}".
                </p>
                <div className="space-y-2">
                  <Input
                    value={newSubGroupName}
                    onChange={(e) => setNewSubGroupName(e.target.value)}
                    placeholder="Enter sub-group name"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSubGroup()}
                    autoFocus
                  />
                  {subGroupError && (
                    <p className="text-xs text-destructive">{subGroupError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewSubGroupInput(false);
                      setNewSubGroupName('');
                      setSubGroupError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateSubGroup}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Group layers within their interface group
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Describe this layer..."
          rows={3}
        />
      </div>

      {showUnits && (
        <div className="space-y-2">
          <Label htmlFor="units">Units</Label>
          <Input
            id="units"
            value={units}
            onChange={(e) => onUpdate('units', e.target.value)}
            placeholder="e.g., meters, hectares"
          />
        </div>
      )}


    </div>
  );
};

export default UnifiedBasicInfoSection;
