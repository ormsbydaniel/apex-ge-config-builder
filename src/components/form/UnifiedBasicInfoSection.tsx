
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // Update handler that supports both flat and nested field paths
  onUpdate: (field: string, value: any) => void;
  
  // Configuration
  showFeatureStatistics?: boolean;
  showUnits?: boolean;
  showIsActive?: boolean;
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
  onUpdate,
  showFeatureStatistics = false,
  showUnits = false,
  showIsActive = false,
  required = { name: true, interfaceGroup: true }
}: UnifiedBasicInfoSectionProps) => {
  return (
    <div className="space-y-4">
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

      {showIsActive && (
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => onUpdate('isActive', checked)}
          />
          <Label htmlFor="isActive">Active by default</Label>
        </div>
      )}
    </div>
  );
};

export default UnifiedBasicInfoSection;
