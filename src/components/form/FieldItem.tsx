/**
 * Individual field configuration row for the Fields Editor table.
 * One row per field with inline editing and ordering controls.
 */

import React from 'react';
import { FieldConfig } from '@/types/category';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface FieldItemProps {
  fieldName: string;
  config: FieldConfig | null;
  onUpdate: (config: FieldConfig | null) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
}

const FieldItem = ({
  fieldName,
  config,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragAttributes,
  dragListeners
}: FieldItemProps) => {
  const isHidden = config === null;

  // The Explorer only formats fields with type "date"; legacy "datetime" values
  // are shown as the same option and normalised to "date" on save.
  const DATE_FORMAT_PRESETS = [
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'dd MMM yyyy',
    'yyyy-MM-dd HH:mm',
    'dd MMM yyyy, HH:mm',
  ];
  const fieldType = config?.type === 'datetime' ? 'date' : (config?.type || 'default');
  const isDateType = fieldType === 'date';
  const formatValue = config?.format || '';
  const isCustomFormat = !!formatValue && !DATE_FORMAT_PRESETS.includes(formatValue);

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
      <tr
        className={cn(
          'group border-b border-border last:border-0 transition-colors',
          isHidden ? 'opacity-50 bg-muted/40' : 'hover:bg-muted/40'
        )}
      >
        {/* Ordering controls */}
        <td className="pl-2 pr-1 py-1.5 w-[72px]">
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Drag to reorder ${fieldName}`}
              className="h-7 w-5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              {...dragAttributes}
              {...dragListeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Move ${fieldName} up`}
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="h-3.5 w-5 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Move ${fieldName} down`}
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="h-3.5 w-5 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </td>

        {/* Field name */}
        <td className="px-2 py-1.5 min-w-[110px]">
          <span
            className={cn(
              'font-mono text-xs truncate block max-w-[140px]',
              isHidden ? 'italic text-muted-foreground' : 'text-muted-foreground'
            )}
            title={fieldName}
          >
            {fieldName}
          </span>
        </td>

        {/* Display label */}
        <td className="px-1 py-1.5 w-auto min-w-[110px]">
          <Input
            id={`label-${fieldName}`}
            aria-label={`Display label for ${fieldName}`}
            placeholder="Display name"
            value={config?.label || ''}
            onChange={(e) => handleConfigChange('label', e.target.value)}
            disabled={isHidden}
            className="h-7 text-sm"
          />
        </td>

        {/* Prefix */}
        <td className="px-1 py-1.5 w-[100px]">
          <Input
            id={`prefix-${fieldName}`}
            aria-label={`Prefix for ${fieldName}`}
            placeholder="-"
            value={config?.prefix || ''}
            onChange={(e) => handleConfigChange('prefix', e.target.value)}
            disabled={isHidden}
            className="h-7 text-sm"
          />
        </td>

        {/* Suffix */}
        <td className="px-1 py-1.5 w-[100px]">
          <Input
            id={`suffix-${fieldName}`}
            aria-label={`Suffix for ${fieldName}`}
            placeholder="-"
            value={config?.suffix || ''}
            onChange={(e) => handleConfigChange('suffix', e.target.value)}
            disabled={isHidden}
            className="h-7 text-sm"
          />
        </td>

        {/* Precision */}
        <td className="px-1 py-1.5 w-12">
          <Input
            id={`precision-${fieldName}`}
            aria-label={`Precision for ${fieldName}`}
            type="number"
            min={0}
            max={10}
            placeholder="-"
            value={config?.precision ?? ''}
            onChange={(e) => handleConfigChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={isHidden}
            className="h-7 text-sm text-center px-1"
          />
        </td>

        {/* Type (+ Format for date fields) */}
        <td className="px-1 py-1.5 w-40 min-w-[160px]">
          <Select
            value={fieldType}
            onValueChange={(value) => handleConfigChange('type', value === 'default' ? undefined : value)}
            disabled={isHidden}
          >
            <SelectTrigger className="h-7 text-xs px-2" aria-label={`Type for ${fieldName}`}>
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="date">Date / DateTime</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          {isDateType && (
            <Select
              value={isCustomFormat ? formatValue : (formatValue || 'none')}
              onValueChange={(value) => {
                if (value === 'none') handleConfigChange('format', undefined);
                else handleConfigChange('format', value);
              }}
              disabled={isHidden}
            >
              <SelectTrigger className="h-6 text-xs px-2" aria-label={`Date format for ${fieldName}`}>
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Raw value</SelectItem>
                {DATE_FORMAT_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                ))}
                {/* Legacy configs may hold a non-preset format string; show it so the
                    current value stays visible and selectable in the dropdown. */}
                {isCustomFormat && (
                  <SelectItem value={formatValue}>{formatValue}</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </td>

        {/* Hidden toggle */}
        <td className="px-2 py-1.5 w-14 text-center">
          <Switch
            id={`hidden-${fieldName}`}
            aria-label={`Hide ${fieldName}`}
            checked={isHidden}
            onCheckedChange={handleToggleHidden}
          />
        </td>

        {/* Delete */}
        <td className="pl-1 pr-2 py-1.5 w-10">
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Delete ${fieldName}`}
              onClick={onRemove}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
  );
};

export default FieldItem;
