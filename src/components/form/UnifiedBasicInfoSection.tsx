
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  onUpdate,
  showFeatureStatistics = false,
  showUnits = false,
  showIsActive = false,
  showToggleable = false,
  required = { name: true, interfaceGroup: true }
}: UnifiedBasicInfoSectionProps) => {
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
