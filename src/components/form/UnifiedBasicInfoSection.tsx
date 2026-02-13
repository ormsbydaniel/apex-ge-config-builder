
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { TimeframeType } from '@/types/config';
import { GroupedPlacementOptions, encodeGroupPlacement, decodeGroupPlacement } from '@/hooks/useGroupPlacementOptions';

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
  
  // Grouped placement options for unified dropdown
  groupedPlacementOptions?: GroupedPlacementOptions[];
  
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
  groupedPlacementOptions = [],
  onUpdate,
  showFeatureStatistics = false,
  showUnits = false,
  showIsActive = false,
  showToggleable = false,
  required = { name: true, interfaceGroup: true }
}: UnifiedBasicInfoSectionProps) => {
  const [showNewSubGroupPopover, setShowNewSubGroupPopover] = useState(false);
  const [newSubGroupName, setNewSubGroupName] = useState('');
  const [newSubGroupParent, setNewSubGroupParent] = useState('');
  const [subGroupError, setSubGroupError] = useState('');

  // Compute existing sub-groups for validation
  const existingSubGroups = useMemo(() => {
    const subGroups = new Set<string>();
    groupedPlacementOptions.forEach(group => {
      group.subGroups.forEach(sg => {
        if (sg.subinterfaceGroup) {
          subGroups.add(`${group.interfaceGroup}::${sg.subinterfaceGroup}`);
        }
      });
    });
    return subGroups;
  }, [groupedPlacementOptions]);

  // Get display value for the select trigger
  const displayValue = useMemo(() => {
    if (subinterfaceGroup) {
      return `${interfaceGroup} → ${subinterfaceGroup}`;
    }
    return interfaceGroup;
  }, [interfaceGroup, subinterfaceGroup]);

  const handlePlacementChange = (value: string) => {
    if (value === '__create_new__') {
      setNewSubGroupParent(interfaceGroup || interfaceGroups[0] || '');
      setShowNewSubGroupPopover(true);
      return;
    }
    
    const { interfaceGroup: newGroup, subinterfaceGroup: newSubGroup } = decodeGroupPlacement(value);
    onUpdate('interfaceGroup', newGroup);
    onUpdate('subinterfaceGroup', newSubGroup || '');
  };

  const handleCreateSubGroup = () => {
    setSubGroupError('');
    
    if (!newSubGroupParent.trim()) {
      setSubGroupError('Please select a parent group');
      return;
    }
    
    if (!newSubGroupName.trim()) {
      setSubGroupError('Sub-group name is required');
      return;
    }
    
    const newSubGroupKey = `${newSubGroupParent}::${newSubGroupName.trim()}`;
    if (existingSubGroups.has(newSubGroupKey)) {
      setSubGroupError('This sub-group already exists');
      return;
    }
    
    // Set both the interface group and new sub-group
    onUpdate('interfaceGroup', newSubGroupParent);
    onUpdate('subinterfaceGroup', newSubGroupName.trim());
    
    setNewSubGroupName('');
    setNewSubGroupParent('');
    setShowNewSubGroupPopover(false);
  };

  const handleCancelCreateSubGroup = () => {
    setShowNewSubGroupPopover(false);
    setNewSubGroupName('');
    setNewSubGroupParent('');
    setSubGroupError('');
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
          <Label htmlFor="layerPlacement">
            Layer Placement {required.interfaceGroup && '*'}
          </Label>
          <Popover open={showNewSubGroupPopover} onOpenChange={setShowNewSubGroupPopover}>
            <div className="flex gap-2">
              <Select
                value={encodeGroupPlacement(interfaceGroup, subinterfaceGroup || undefined)}
                onValueChange={handlePlacementChange}
                required={required.interfaceGroup}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select placement...">
                    {displayValue || "Select placement..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groupedPlacementOptions.map((group, groupIdx) => (
                    <React.Fragment key={group.interfaceGroup}>
                      {groupIdx > 0 && <SelectSeparator />}
                      {/* Parent group option */}
                      <SelectItem value={group.interfaceGroup}>
                        {group.interfaceGroup}
                      </SelectItem>
                      {/* Sub-group options with indentation */}
                      {group.subGroups.map(subGroup => (
                        <SelectItem 
                          key={subGroup.value} 
                          value={subGroup.value}
                          className="pl-8"
                        >
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <ChevronRight className="h-3 w-3 text-blue-500" />
                            {subGroup.subinterfaceGroup}
                          </span>
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                  {groupedPlacementOptions.length > 0 && <SelectSeparator />}
                  <SelectItem value="__create_new__" className="text-blue-600">
                    <span className="flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      Create new sub-group...
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  title="Create new sub-group"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </div>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Create New Sub-Group</h4>
                
                <div className="space-y-2">
                  <Label>Parent Group</Label>
                  <Select value={newSubGroupParent} onValueChange={setNewSubGroupParent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent group" />
                    </SelectTrigger>
                    <SelectContent>
                      {interfaceGroups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sub-Group Name</Label>
                  <Input
                    value={newSubGroupName}
                    onChange={(e) => setNewSubGroupName(e.target.value)}
                    placeholder="Enter sub-group name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSubGroup())}
                    autoFocus
                  />
                  {subGroupError && (
                    <p className="text-xs text-destructive">{subGroupError}</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelCreateSubGroup}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateSubGroup}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
