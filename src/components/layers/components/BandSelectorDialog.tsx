import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BandSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cogBandCount: number;
  currentBands: number[];
  onSave: (bands: number[], applyToAll: boolean) => void;
  cogCount: number;
  bandLabels?: string[];
}

interface SortableBandRowProps {
  band: number;
  idx: number;
  total: number;
  getBandLabel: (band: number) => string;
  onDeselect: (band: number) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
}

function SortableBandRow({ band, idx, total, getBandLabel, onDeselect, onMoveUp, onMoveDown }: SortableBandRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: band.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 px-1.5 py-1.5 text-xs rounded select-none hover:bg-muted transition-colors"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <Checkbox
        checked={true}
        onCheckedChange={() => onDeselect(band)}
      />
      <span className="text-muted-foreground w-4 text-right flex-shrink-0">{idx + 1}.</span>
      <span className="flex-1 truncate">{getBandLabel(band)}</span>
      <div className="ml-auto flex gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => onMoveUp(idx)}
          disabled={idx === 0}
          title="Move up"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => onMoveDown(idx)}
          disabled={idx === total - 1}
          title="Move down"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function BandSelectorDialog({
  open,
  onOpenChange,
  cogBandCount,
  currentBands,
  onSave,
  cogCount,
  bandLabels,
}: BandSelectorDialogProps) {
  const [selectedBands, setSelectedBands] = useState<number[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);

  const currentBandsKey = JSON.stringify(currentBands || []);
  useEffect(() => {
    if (open) {
      setSelectedBands([...(currentBands || [])]);
      setApplyToAll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentBandsKey]);

  const allBands = useMemo(
    () => Array.from({ length: cogBandCount }, (_, i) => i + 1),
    [cogBandCount]
  );

  const availableBands = useMemo(
    () => allBands.filter((b) => !selectedBands.includes(b)),
    [allBands, selectedBands]
  );

  const getBandLabel = (band: number) => {
    const label = bandLabels?.[band - 1];
    return label ? `Band ${band} (${label})` : `Band ${band}`;
  };

  const selectBand = (band: number) => {
    setSelectedBands((prev) => [...prev, band]);
  };

  const deselectBand = (band: number) => {
    setSelectedBands((prev) => prev.filter((b) => b !== band));
  };

  const moveBandUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedBands((prev) => arrayMove(prev, idx, idx - 1));
  };

  const moveBandDown = (idx: number) => {
    setSelectedBands((prev) => {
      if (idx >= prev.length - 1) return prev;
      return arrayMove(prev, idx, idx + 1);
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedBands((prev) => {
        const oldIndex = prev.indexOf(Number(active.id));
        const newIndex = prev.indexOf(Number(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const sortableIds = useMemo(
    () => selectedBands.map((b) => b.toString()),
    [selectedBands]
  );

  const handleSave = () => {
    onSave(selectedBands, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Band Selection</DialogTitle>
          <DialogDescription>
            Tick a band to select it. Untick to remove. Drag or use arrows to reorder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-stretch h-[320px] flex-shrink-0">
          {/* Available Bands */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Available Bands ({availableBands.length})
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-1">
                {availableBands.map((band) => (
                  <label
                    key={band}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer select-none hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => selectBand(band)}
                    />
                    {getBandLabel(band)}
                  </label>
                ))}
                {availableBands.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    All bands selected
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Bands */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Selected Bands ({selectedBands.length})
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    {selectedBands.map((band, idx) => (
                      <SortableBandRow
                        key={band}
                        band={band}
                        idx={idx}
                        total={selectedBands.length}
                        getBandLabel={getBandLabel}
                        onDeselect={deselectBand}
                        onMoveUp={moveBandUp}
                        onMoveDown={moveBandDown}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {selectedBands.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No bands selected
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

        </div>

        {/* Apply to all checkbox */}
        {cogCount > 1 && (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="apply-to-all"
              checked={applyToAll}
              onCheckedChange={(checked) => setApplyToAll(checked === true)}
            />
            <label htmlFor="apply-to-all" className="text-sm text-muted-foreground cursor-pointer">
              Apply to all COG sources in this layer ({cogCount} COGs)
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
