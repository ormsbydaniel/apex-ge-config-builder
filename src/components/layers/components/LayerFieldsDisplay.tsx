
/**
 * Read-only display of field configurations in the layer card content.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { List, EyeOff, Pencil } from 'lucide-react';
import { FieldsConfig } from '@/types/category';
import FieldsEditorDialog from '@/components/form/FieldsEditorDialog';

interface LayerFieldsDisplayProps {
  fields: FieldsConfig;
  onUpdate?: (fields: FieldsConfig) => void;
  sourceUrl?: string;
  sourceFormat?: string;
}

const LayerFieldsDisplay = ({ fields, onUpdate, sourceUrl, sourceFormat }: LayerFieldsDisplayProps) => {
  const fieldEntries = Object.entries(fields);
  const hasFields = fieldEntries.length > 0;

  const visibleFields = fieldEntries
    .filter(([_, config]) => config !== null)
    .sort((a, b) => {
      const orderA = a[1]?.order ?? 999;
      const orderB = b[1]?.order ?? 999;
      return orderA - orderB;
    });
  
  const hiddenFields = fieldEntries.filter(([_, config]) => config === null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <List className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">
          Fields{hasFields ? ` (${fieldEntries.length})` : ''}
        </h4>
        {onUpdate && (
          <FieldsEditorDialog
            fields={fields}
            onUpdate={onUpdate}
            sourceUrl={sourceUrl}
            sourceFormat={sourceFormat}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </div>
      
      {hasFields ? (
        <div className="space-y-2 ml-6">
          {/* Visible fields */}
          {visibleFields.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleFields.map(([fieldName, config]) => (
                <Badge 
                  key={fieldName} 
                  variant="secondary" 
                  className="text-[11px] font-normal text-muted-foreground bg-muted/50 border-0 rounded px-1.5 py-0.5"
                  title={[
                    config?.prefix && `Prefix: ${config.prefix}`,
                    config?.suffix && `Suffix: ${config.suffix}`,
                    config?.precision !== undefined && `Precision: ${config.precision}`,
                    config?.type && `Type: ${config.type}`,
                    config?.format && `Format: ${config.format}`,
                  ].filter(Boolean).join(', ') || 'No additional configuration'}
                >
                  {config?.label || fieldName}
                  {config?.order !== undefined && (
                    <span className="ml-1 text-muted-foreground/70">#{config.order}</span>
                  )}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Hidden fields summary */}
          {hiddenFields.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <EyeOff className="h-3 w-3" />
              {hiddenFields.length} hidden: {hiddenFields.map(([name]) => name).join(', ')}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">All fields (default display)</p>
      )}
    </div>
  );
};

export default LayerFieldsDisplay;
