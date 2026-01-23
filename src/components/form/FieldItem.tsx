/**
 * Individual field configuration row for the Fields Editor.
 */

import React from 'react';
import { FieldConfig } from '@/types/category';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FieldItemProps {
  fieldName: string;
  config: FieldConfig | null;
  onUpdate: (config: FieldConfig | null) => void;
  onRemove: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const FieldItem = ({
  fieldName,
  config,
  onUpdate,
  onRemove,
  isExpanded = false,
  onToggleExpand
}: FieldItemProps) => {
  const isHidden = config === null;

  const handleToggleHidden = () => {
    onUpdate(isHidden ? {} : null);
  };

  const handleConfigChange = (key: keyof FieldConfig, value: any) => {
    if (isHidden) return;
    
    const newConfig = { ...config, [key]: value };
    
    // Remove empty string values to keep the config clean
    if (value === '' || value === undefined) {
      delete newConfig[key];
    }
    
    onUpdate(newConfig);
  };

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center gap-3">
        {/* Field name */}
        <div className="flex-1 min-w-0">
          <span className="font-mono text-sm truncate block" title={fieldName}>
            {fieldName}
          </span>
        </div>

        {/* Hidden toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor={`hidden-${fieldName}`} className="text-xs text-muted-foreground">
            Hide
          </Label>
          <Switch
            id={`hidden-${fieldName}`}
            checked={isHidden}
            onCheckedChange={handleToggleHidden}
          />
        </div>

        {/* Expand/collapse for configuration */}
        {!isHidden && onToggleExpand && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Delete button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Configuration fields - shown when expanded and not hidden */}
      {!isHidden && isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Label */}
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                placeholder="Display name"
                value={config?.label || ''}
                onChange={(e) => handleConfigChange('label', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Order */}
            <div className="space-y-1">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                placeholder="Display order"
                value={config?.order ?? ''}
                onChange={(e) => handleConfigChange('order', e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Prefix */}
            <div className="space-y-1">
              <Label className="text-xs">Prefix</Label>
              <Input
                placeholder="e.g., approx."
                value={config?.prefix || ''}
                onChange={(e) => handleConfigChange('prefix', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Suffix */}
            <div className="space-y-1">
              <Label className="text-xs">Suffix</Label>
              <Input
                placeholder="e.g., km²"
                value={config?.suffix || ''}
                onChange={(e) => handleConfigChange('suffix', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Precision */}
            <div className="space-y-1">
              <Label className="text-xs">Precision</Label>
              <Input
                type="number"
                min={0}
                max={10}
                placeholder="Decimals"
                value={config?.precision ?? ''}
                onChange={(e) => handleConfigChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Type and Format row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={config?.type || 'default'}
                onValueChange={(value) => handleConfigChange('type', value === 'default' ? undefined : value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="datetime">DateTime</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format - only show for date types */}
            {(config?.type === 'date' || config?.type === 'datetime') && (
              <div className="space-y-1">
                <Label className="text-xs">Format</Label>
                <Input
                  placeholder="e.g., yyyy-MM-dd"
                  value={config?.format || ''}
                  onChange={(e) => handleConfigChange('format', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden indicator */}
      {isHidden && (
        <div className="mt-2 text-xs text-muted-foreground italic">
          This field will be hidden from display
        </div>
      )}
    </div>
  );
};

export default FieldItem;
