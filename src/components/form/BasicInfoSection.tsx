
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataSource } from '@/types/config';

interface BasicInfoSectionProps {
  formData: DataSource;
  interfaceGroups: string[];
  hasFeatureStatistics: boolean;
  onUpdateFormData: (path: string, value: any) => void;
  onSetHasFeatureStatistics: (value: boolean) => void;
}

const BasicInfoSection = ({
  formData,
  interfaceGroups,
  hasFeatureStatistics,
  onUpdateFormData,
  onSetHasFeatureStatistics
}: BasicInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Layer Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onUpdateFormData('name', e.target.value)}
            placeholder="e.g., Winter Cereals 2021"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interfaceGroup">Interface Group *</Label>
          <Select
            value={formData.layout.interfaceGroup}
            onValueChange={(value) => onUpdateFormData('layout.interfaceGroup', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
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
          value={formData.meta.description}
          onChange={(e) => onUpdateFormData('meta.description', e.target.value)}
          placeholder="Describe this layer..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => onUpdateFormData('isActive', checked)}
          />
          <Label htmlFor="isActive">Active by default</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="hasFeatureStatistics"
            checked={hasFeatureStatistics}
            onCheckedChange={onSetHasFeatureStatistics}
          />
          <Label htmlFor="hasFeatureStatistics">Has feature statistics</Label>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
