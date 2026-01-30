/**
 * Tab content for the Fields Editor dialog.
 * Provides Define, Auto-detect, and Copy from Layer tabs.
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2 } from 'lucide-react';
import { FieldsConfig } from '@/types/category';
import FieldItem from './FieldItem';
import FieldsCopyFromLayer from './FieldsCopyFromLayer';
import { detectFieldsFromSource, DetectedField } from '@/utils/fieldDetection';
import { useToast } from '@/hooks/use-toast';

interface AvailableSourceLayer {
  name: string;
  fields: FieldsConfig;
}

interface FieldsEditorTabsProps {
  activeTab: string;
  localFields: FieldsConfig;
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  sourceUrl?: string;
  sourceFormat?: string;
  newFieldName: string;
  onActiveTabChange: (tab: string) => void;
  onSetLocalFields: (fields: FieldsConfig) => void;
  onSetSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
  onSetNewFieldName: (name: string) => void;
  onAddField: (name: string) => void;
  onUpdateField: (fieldName: string, config: any) => void;
  onRemoveField: (fieldName: string) => void;
  onImportDetectedFields: (fieldNames: string[], mode: 'append' | 'replace') => void;
}

const FieldsEditorTabs = ({
  activeTab,
  localFields,
  availableSourceLayers,
  selectedSourceLayer,
  sourceUrl,
  sourceFormat,
  newFieldName,
  onActiveTabChange,
  onSetSelectedSourceLayer,
  onCopyFromLayer,
  onSetNewFieldName,
  onAddField,
  onUpdateField,
  onRemoveField,
  onImportDetectedFields
}: FieldsEditorTabsProps) => {
  const { toast } = useToast();
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [selectedDetectedFields, setSelectedDetectedFields] = useState<Set<string>>(new Set());

  const fieldCount = Object.keys(localFields).length;
  const visibleFieldCount = Object.values(localFields).filter(v => v !== null).length;
  const hiddenFieldCount = fieldCount - visibleFieldCount;

  const handleDetectFields = async () => {
    if (!sourceUrl || !sourceFormat) {
      toast({
        title: 'Cannot detect fields',
        description: 'No vector source URL available for this layer.',
        variant: 'destructive'
      });
      return;
    }

    setIsDetecting(true);
    try {
      const fields = await detectFieldsFromSource(sourceUrl, sourceFormat);
      setDetectedFields(fields);
      // Pre-select all detected fields
      setSelectedDetectedFields(new Set(fields.map(f => f.name)));
      
      if (fields.length === 0) {
        toast({
          title: 'No fields detected',
          description: 'Could not detect any fields from the source.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Detection failed',
        description: error instanceof Error ? error.message : 'Failed to detect fields',
        variant: 'destructive'
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleDetectedField = (fieldName: string) => {
    setSelectedDetectedFields(prev => {
      const updated = new Set(prev);
      if (updated.has(fieldName)) {
        updated.delete(fieldName);
      } else {
        updated.add(fieldName);
      }
      return updated;
    });
  };

  const handleImportSelected = (mode: 'append' | 'replace') => {
    const fieldNames = Array.from(selectedDetectedFields);
    onImportDetectedFields(fieldNames, mode);
    setDetectedFields([]);
    setSelectedDetectedFields(new Set());
  };

  const handleAddNewField = () => {
    if (newFieldName.trim()) {
      onAddField(newFieldName.trim());
    }
  };

  const canDetect = sourceUrl && sourceFormat;

  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="define" className="flex items-center gap-2">
          Define fields
          <Badge variant="secondary" className="text-xs">
            {fieldCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="detect" disabled={!canDetect} className="flex items-center gap-2">
          Auto-detect
        </TabsTrigger>
        <TabsTrigger 
          value="copy" 
          disabled={availableSourceLayers.length === 0}
          className="flex items-center gap-2"
        >
          Copy from layer
          <Badge variant="secondary" className="text-xs">
            {availableSourceLayers.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* Define Tab */}
      <TabsContent value="define" className="space-y-4">
        {/* Summary */}
        {fieldCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {visibleFieldCount} visible, {hiddenFieldCount} hidden
          </div>
        )}

        {/* Field list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {Object.entries(localFields).map(([fieldName, config]) => (
            <FieldItem
              key={fieldName}
              fieldName={fieldName}
              config={config}
              onUpdate={(newConfig) => onUpdateField(fieldName, newConfig)}
              onRemove={() => onRemoveField(fieldName)}
              isExpanded={expandedField === fieldName}
              onToggleExpand={() => setExpandedField(expandedField === fieldName ? null : fieldName)}
            />
          ))}
        </div>

        {/* Add new field */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Enter field name..."
            value={newFieldName}
            onChange={(e) => onSetNewFieldName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewField();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddNewField}
            disabled={!newFieldName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>
      </TabsContent>

      {/* Auto-detect Tab */}
      <TabsContent value="detect" className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Detect field names from the vector data source.
        </div>
        
        {sourceUrl && (
          <div className="text-xs font-mono bg-muted p-2 rounded truncate" title={sourceUrl}>
            {sourceUrl}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleDetectFields}
          disabled={isDetecting || !canDetect}
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Detect Fields
            </>
          )}
        </Button>

        {/* Detected fields preview */}
        {detectedFields.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Detected {detectedFields.length} fields:
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {detectedFields.map((field) => (
                <label
                  key={field.name}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDetectedFields.has(field.name)}
                    onChange={() => toggleDetectedField(field.name)}
                    className="rounded"
                  />
                  <span className="font-mono text-sm">{field.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                </label>
              ))}
            </div>
            
            <div className="flex gap-2">
              {fieldCount > 0 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImportSelected('append')}
                    disabled={selectedDetectedFields.size === 0}
                  >
                    Append Selected ({selectedDetectedFields.size})
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => handleImportSelected('replace')}
                    disabled={selectedDetectedFields.size === 0}
                  >
                    Replace All ({selectedDetectedFields.size})
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleImportSelected('replace')}
                  disabled={selectedDetectedFields.size === 0}
                >
                  Import Selected ({selectedDetectedFields.size})
                </Button>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      {/* Copy from Layer Tab */}
      <TabsContent value="copy">
        <FieldsCopyFromLayer
          availableSourceLayers={availableSourceLayers}
          selectedSourceLayer={selectedSourceLayer}
          setSelectedSourceLayer={onSetSelectedSourceLayer}
          onCopyFromLayer={onCopyFromLayer}
        />
      </TabsContent>
    </Tabs>
  );
};

export default FieldsEditorTabs;
