
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface LayerBasicInfoSectionProps {
  name: string;
  description: string;
  interfaceGroup: string;
  hasFeatureStatistics: boolean;
  units: string;
  interfaceGroups: string[];
  onUpdate: (field: string, value: any) => void;
}

const LayerBasicInfoSection = ({
  name,
  description,
  interfaceGroup,
  hasFeatureStatistics,
  units,
  interfaceGroups,
  onUpdate
}: LayerBasicInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Layer Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="e.g., WorldCover 2021"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Describe what this layer shows..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interfaceGroup">Interface Group</Label>
        <Select value={interfaceGroup} onValueChange={(value) => onUpdate('interfaceGroup', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select interface group" />
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

      <div className="flex items-center space-x-2">
        <Switch
          id="hasFeatureStatistics"
          checked={hasFeatureStatistics}
          onCheckedChange={(value) => onUpdate('hasFeatureStatistics', value)}
        />
        <Label htmlFor="hasFeatureStatistics">Has Feature Statistics</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="units">Units</Label>
        <Input
          id="units"
          value={units}
          onChange={(e) => onUpdate('units', e.target.value)}
          placeholder="e.g., km², %"
        />
      </div>
    </div>
  );
};

export default LayerBasicInfoSection;
