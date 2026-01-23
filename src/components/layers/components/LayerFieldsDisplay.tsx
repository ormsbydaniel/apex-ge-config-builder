/**
 * Read-only display of field configurations in the layer card content.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { List, EyeOff } from 'lucide-react';
import { FieldsConfig } from '@/types/category';

interface LayerFieldsDisplayProps {
  fields: FieldsConfig;
}

const LayerFieldsDisplay = ({ fields }: LayerFieldsDisplayProps) => {
  const fieldEntries = Object.entries(fields);
  
  if (fieldEntries.length === 0) {
    return null;
  }

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
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <List className="h-4 w-4" />
        Fields ({fieldEntries.length})
      </h4>
      
      <div className="space-y-2">
        {/* Visible fields */}
        {visibleFields.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleFields.map(([fieldName, config]) => (
              <Badge 
                key={fieldName} 
                variant="outline" 
                className="text-xs font-mono"
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
                  <span className="ml-1 text-muted-foreground">#{config.order}</span>
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
    </div>
  );
};

export default LayerFieldsDisplay;
