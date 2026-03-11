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
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { fetchCogHeaderMetadata } from '@/utils/cogMetadata';

interface RgbCompositeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

const RGB_COLORS = ['hsl(0, 84%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];
const RGB_LABELS = ['R', 'G', 'B'];
const MAX_BANDS = 3;

interface SortableRgbBandRowProps {
  band: number;
  idx: number;
  total: number;
  getBandLabel: (band: number) => string;
  onDeselect: (band: number) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
}

function SortableRgbBandRow({ band, idx, total, getBandLabel, onDeselect, onMoveUp, onMoveDown }: SortableRgbBandRowProps) {
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
      {/* RGB color dot */}
      <span
        className="inline-flex items-center justify-center rounded text-[9px] font-bold text-white w-4 h-4 flex-shrink-0"
        style={{ backgroundColor: RGB_COLORS[idx] || 'hsl(var(--muted-foreground))' }}
      >
        {RGB_LABELS[idx] || '?'}
      </span>
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

export function RgbCompositeEditorDialog({
  open,
  onOpenChange,
  source,
  onUpdateDataSources,
}: RgbCompositeEditorDialogProps) {
  const [enableRgb, setEnableRgb] = useState(false);
  const [selectedBands, setSelectedBands] = useState<number[]>([1, 2, 3]);
  const [cogBandCount, setCogBandCount] = useState(3);
  const [loading, setLoading] = useState(false);

  const bandLabels = (source.meta as any)?.bandLabels as string[] | undefined;

  // Find first COG source URL for band count
  const firstCogUrl = useMemo(() => {
    return (source.data || []).find((d: DataSourceItem) => d.format === 'cog')?.url;
  }, [source.data]);

  // Initialize state only when dialog opens (not on source.data changes during editing)
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const rgbSources = (source.data || []).filter((d: DataSourceItem) => d.convertToRGB === true);
      setEnableRgb(rgbSources.length > 0);
      const firstRgb = rgbSources[0];
      const bands = firstRgb?.bands && firstRgb.bands.length >= 3
        ? firstRgb.bands.slice(0, 3)
        : [1, 2, 3];
      setSelectedBands(bands);
    }
    prevOpenRef.current = open;
  }, [open, source.data]);

  // Fetch band count from first COG
  useEffect(() => {
    if (!open || !firstCogUrl) return;
    let cancelled = false;
    setLoading(true);
    fetchCogHeaderMetadata(firstCogUrl)
      .then((meta) => {
        if (!cancelled && meta.samplesPerPixel) {
          setCogBandCount(meta.samplesPerPixel);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, firstCogUrl]);

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
    if (selectedBands.length >= MAX_BANDS) return;
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
    const updatedData = (source.data || []).map((d: DataSourceItem) => {
      if (d.format === 'cog') {
        if (enableRgb) {
          return { ...d, convertToRGB: true, bands: [...selectedBands] };
        } else {
          const { convertToRGB, ...rest } = d;
          return rest as DataSourceItem;
        }
      }
      return d;
    });
    onUpdateDataSources(updatedData);
    onOpenChange(false);
  };

  const atLimit = selectedBands.length >= MAX_BANDS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>RGB Composite Editor</DialogTitle>
          <DialogDescription>
            Enable RGB rendering and assign bands to the Red, Green, and Blue channels. Changes apply to all COG sources in this layer.
          </DialogDescription>
        </DialogHeader>

        {/* Enable toggle */}
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <Checkbox
            checked={enableRgb}
            onCheckedChange={(checked) => setEnableRgb(checked === true)}
          />
          <span className="text-sm font-medium">Enable RGB Composite rendering</span>
        </label>

        {/* Band selector — only shown when enabled */}
        {enableRgb && (
          <>
            {loading ? (
              <div className="text-xs text-muted-foreground py-4 text-center">Loading band information…</div>
            ) : (
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
                          className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded select-none transition-colors ${
                            atLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={false}
                            disabled={atLimit}
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
                  {atLimit && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Maximum 3 bands (R, G, B). Deselect one to change.
                    </div>
                  )}
                </div>

                {/* Selected Bands (R, G, B) */}
                <div className="flex-1 flex flex-col">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Selected Bands ({selectedBands.length}/{MAX_BANDS})
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
                            <SortableRgbBandRow
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
                          Select 3 bands for R, G, B channels
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={enableRgb && selectedBands.length !== MAX_BANDS}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
