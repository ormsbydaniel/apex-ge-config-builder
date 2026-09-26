/**
 * Tab content for the Fields Editor dialog.
 * Provides Define and Copy from Layer tabs.
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
import { detectFieldsFromSource } from '@/utils/fieldDetection';
import { useToast } from '@/hooks/use-toast';
import { assignFieldOrder } from '@/utils/fieldOrder';
import { fieldDetectionSources, mergeDetectedFields } from '@/utils/populateFieldDetails';
import type { DataSourceItem } from '@/types/dataSource';

interface AvailableSourceLayer {
  name: string;
  fields: FieldsConfig;
}

interface FieldsEditorTabsProps {
  activeTab: string;
  localFields: FieldsConfig;
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  dataSources: DataSourceItem[];
  newFieldName: string;
  onActiveTabChange: (tab: string) => void;
  onSetLocalFields: (fields: FieldsConfig) => void;
  onSetSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
  onSetNewFieldName: (name: string) => void;
  onAddField: (name: string) => void;
  onUpdateField: (fieldName: string, config: any) => void;
  onRemoveField: (fieldName: string) => void;
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
}: {
  fieldName: string;
  config: FieldConfig | null;
  onUpdate: (config: FieldConfig | null) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
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
  dataSources,
  newFieldName,
  onActiveTabChange,
  onSetSelectedSourceLayer,
  onCopyFromLayer,
  onSetNewFieldName,
  onAddField,
  onUpdateField,
  onRemoveField,
  onSetLocalFields
}: FieldsEditorTabsProps) => {
  const { toast } = useToast();
  const [isDetecting, setIsDetecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const supportedSources = fieldDetectionSources(dataSources);

  const fieldCount = Object.keys(localFields).length;
  const visibleFieldCount = Object.values(localFields).filter(v => v !== null).length;
  const hiddenFieldCount = fieldCount - visibleFieldCount;

  const handleDetectFields = async (source: (typeof supportedSources)[number]) => {
    setPickerOpen(false);
    setIsDetecting(true);
    try {
      const fields = await detectFieldsFromSource(source.url, source.format);
      if (fields.length === 0) {
        toast({
          title: 'No fields found',
          description: 'This file has no readable fields.',
          variant: 'destructive'
        });
      } else {
        const newCount = fields.filter(field => field.name && !Object.prototype.hasOwnProperty.call(localFields, field.name)).length;
        onSetLocalFields(mergeDetectedFields(localFields, fields));
        toast({ title: 'Field details populated', description: `${newCount} new field${newCount === 1 ? '' : 's'} added.` });
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

  const handleAddNewField = () => {
    if (newFieldName.trim()) {
      onAddField(newFieldName.trim());
    }
  };

  // The hook sorts by explicit order on open; during editing row order is authoritative.
  const fieldNames = Object.keys(localFields);
  const reorderFields = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fieldNames.length || fromIndex === toIndex) return;
    const next = [...fieldNames];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onSetLocalFields(assignFieldOrder(localFields, next));
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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="define" className="flex items-center gap-2">
          Define fields
          <Badge variant="secondary" className="text-xs">
            {fieldCount}
          </Badge>
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
        <div className="flex flex-wrap items-center gap-3">
          {supportedSources.length > 1 ? (
            <Popover open={pickerOpen} onOpenChange={setPickerOpen} modal>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" disabled={isDetecting} aria-expanded={pickerOpen}>
                  {isDetecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {isDetecting ? 'Populating…' : 'Populate field details'}
                  <ChevronsUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(440px,85vw)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search vector files…" aria-label="Search vector files" />
                  <CommandList className="max-h-64">
                    <CommandEmpty>No matching files.</CommandEmpty>
                    <CommandGroup>
                      {supportedSources.map(source => (
                        <CommandItem
                          key={source.index}
                          value={`${source.index} ${source.url}`}
                          onSelect={() => handleDetectFields(source)}
                          title={source.url}
                        >
                          <span className="min-w-0 truncate">{source.url.split(/[/?#]/).filter(Boolean).pop() || source.url}</span>
                          <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground">#{source.index + 1} · {source.format}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Button type="button" variant="outline" disabled={isDetecting || supportedSources.length === 0} onClick={() => {
              const source = supportedSources[0];
              if (source) void handleDetectFields(source);
            }}>
              {isDetecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {isDetecting ? 'Populating…' : 'Populate field details'}
            </Button>
          )}
          {supportedSources.length === 0 && <span className="text-xs text-muted-foreground">Add a GeoJSON or FlatGeoBuf file to populate fields.</span>}
        </div>
        {/* Summary */}
        {fieldCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {visibleFieldCount} visible, {hiddenFieldCount} hidden
          </div>
        )}

        {/* Field table */}
        {fieldCount > 0 && (
          <div className="max-h-[320px] overflow-auto border border-border rounded-lg">
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
                    <th className="px-1 py-2 w-16">Prefix</th>
                    <th className="px-1 py-2 w-16">Suffix</th>
                    <th className="px-1 py-2 w-12 text-center">Prec.</th>
                    <th className="px-1 py-2 w-28">Type</th>
                    <th className="px-2 py-2 w-14 text-center">Hide</th>
                    <th className="pl-1 pr-2 py-2 w-10" aria-label="Actions" />
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
