
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Category } from '@/types/config';

interface CategoryValueToggleProps {
  useValues: boolean;
  onToggle: (checked: boolean) => void;
}

const CategoryValueToggle = ({ useValues, onToggle }: CategoryValueToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Use Category Values</Label>
        <p className="text-xs text-muted-foreground">
          Enable numeric values for categories (useful for statistics and data mapping)
        </p>
      </div>
      <Switch
        checked={useValues}
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default CategoryValueToggle;
