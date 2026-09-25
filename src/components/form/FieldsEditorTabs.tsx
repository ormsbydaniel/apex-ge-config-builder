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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldsConfig, FieldConfig } from '@/types/category';
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

/** Sortable wrapper around a field table row. */
const SortableFieldRow = ({
  fieldName,
  config,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isExpanded,
  onToggleExpand,
}: {
  fieldName: string;
  config: FieldConfig | null;
  onUpdate: (config: FieldConfig | null) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldName,
  });

  return (
    <tbody
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : undefined,
        position: 'relative',
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <FieldItem
        fieldName={fieldName}
        config={config}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </tbody>
  );
};

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

  // Field ordering: rebuild the fields object in a new key order.
  const fieldNames = Object.keys(localFields);
  const reorderFields = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fieldNames.length || fromIndex === toIndex) return;
    const next = [...fieldNames];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const reordered: FieldsConfig = {};
    next.forEach((name) => {
      reordered[name] = localFields[name];
    });
    onSetLocalFields(reordered);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = fieldNames.indexOf(String(active.id));
    const toIndex = fieldNames.indexOf(String(over.id));
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderFields(fromIndex, toIndex);
    }
  };

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

        {/* Field table */}
        {fieldCount > 0 && (
          <div className="max-h-[320px] overflow-y-auto border border-border rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/60 sticky top-0 z-10 border-b border-border">
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <th className="pl-2 pr-1 py-2 w-[72px]" aria-label="Reorder" />
                    <th className="px-2 py-2">Field name</th>
                    <th className="px-1 py-2">Display label</th>
                    <th className="px-1 py-2 w-24">Prefix</th>
                    <th className="px-1 py-2 w-24">Suffix</th>
                    <th className="px-1 py-2 w-16 text-center">Prec.</th>
                    <th className="px-2 py-2 w-14 text-center">Hide</th>
                    <th className="pl-1 pr-2 py-2 w-[72px]" aria-label="Actions" />
                  </tr>
                </thead>
                <SortableContext
                  items={fieldNames}
                  strategy={verticalListSortingStrategy}
                >
                  {fieldNames.map((fieldName, index) => (
                    <SortableFieldRow
                      key={fieldName}
                      fieldName={fieldName}
                      config={localFields[fieldName]}
                      onUpdate={(newConfig) => onUpdateField(fieldName, newConfig)}
                      onRemove={() => onRemoveField(fieldName)}
                      onMoveUp={() => reorderFields(index, index - 1)}
                      onMoveDown={() => reorderFields(index, index + 1)}
                      canMoveUp={index > 0}
                      canMoveDown={index < fieldNames.length - 1}
                      isExpanded={expandedField === fieldName}
                      onToggleExpand={() => setExpandedField(expandedField === fieldName ? null : fieldName)}
                    />
                  ))}
                </SortableContext>
              </table>
            </DndContext>
          </div>
        )}

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
