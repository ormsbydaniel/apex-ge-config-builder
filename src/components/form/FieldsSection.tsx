/**
 * Fields section component for the LayerCardForm.
 * Displays current field configurations and provides a trigger to open the editor.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, EyeOff, List } from 'lucide-react';
import { FieldsConfig } from '@/types/category';
import FieldsEditorDialog from './FieldsEditorDialog';

interface FieldsSectionProps {
  fields: FieldsConfig;
  onUpdate: (field: string, value: any) => void;
  sourceUrl?: string;
  sourceFormat?: string;
}

const FieldsSection = ({
  fields,
  onUpdate,
  sourceUrl,
  sourceFormat
}: FieldsSectionProps) => {
  const handleFieldsUpdate = (updatedFields: FieldsConfig) => {
    onUpdate('fields', updatedFields);
  };

  const fieldEntries = Object.entries(fields);
  const visibleFields = fieldEntries.filter(([_, config]) => config !== null);
  const hiddenFields = fieldEntries.filter(([_, config]) => config === null);

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <List className="h-4 w-4" />
        Fields
      </h4>
      
      {fieldEntries.length > 0 && (
        <div className="space-y-2">
          {/* Visible fields */}
          {visibleFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleFields.map(([fieldName, config]) => (
                <Badge 
                  key={fieldName} 
                  variant="secondary" 
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <span className="font-mono text-xs">
                    {config?.label || fieldName}
                  </span>
                  {config?.order !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      #{config.order}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Hidden fields summary */}
          {hiddenFields.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <EyeOff className="h-3 w-3" />
              {hiddenFields.length} hidden field{hiddenFields.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
      
      <FieldsEditorDialog
        fields={fields}
        onUpdate={handleFieldsUpdate}
        sourceUrl={sourceUrl}
        sourceFormat={sourceFormat}
        trigger={
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="bg-white border-transparent text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-7"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {fieldEntries.length > 0 
              ? `Edit Fields (${fieldEntries.length})` 
              : "Add Fields"
            }
          </Button>
        }
      />
    </div>
  );
};

export default FieldsSection;
