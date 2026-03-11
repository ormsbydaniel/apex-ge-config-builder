import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, GripVertical, Settings, ArrowLeft } from 'lucide-react';
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
import { fetchCogHeaderMetadata, fetchBandHistogram, BandHistogramResult } from '@/utils/cogMetadata';
import { BandHistogram } from './BandHistogram';

interface RgbCompositeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

const RGB_COLORS = ['hsl(0, 84%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];
const RGB_LABELS = ['R', 'G', 'B'];
const CHANNEL_NAMES = ['Red', 'Green', 'Blue'];
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
      <Checkbox
        checked={true}
        onCheckedChange={() => onDeselect(band)}
      />
      <span className="flex-1 truncate">{getBandLabel(band)}</span>
      <div className="flex gap-0.5 items-center">
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
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground flex-shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface ChannelMinMax {
  min: number;
  max: number;
}

function buildRgbStyle(
  r: ChannelMinMax,
  g: ChannelMinMax,
  b: ChannelMinMax
) {
  return {
    variables: {
      rBand: 1,
      gBand: 2,
      bBand: 3,
      rMin: r.min,
      rMax: r.max,
      gMin: g.min,
      gMax: g.max,
      bMin: b.min,
      bMax: b.max,
    },
    color: [
      "array",
      [
        "interpolate", ["linear"],
        ["band", ["var", "rBand"]],
        ["var", "rMin"], 0,
        ["var", "rMax"], 1,
      ],
      [
        "interpolate", ["linear"],
        ["band", ["var", "gBand"]],
        ["var", "gMin"], 0,
        ["var", "gMax"], 1,
      ],
      [
        "interpolate", ["linear"],
        ["band", ["var", "bBand"]],
        ["var", "bMin"], 0,
        ["var", "bMax"], 1,
      ],
      [
        "case",
        ["==", ["band", ["var", "rBand"]], 0],
        0,
        1,
      ],
    ],
  };
}

export function RgbCompositeEditorDialog({
  open,
  onOpenChange,
  source,
  onUpdateDataSources,
}: RgbCompositeEditorDialogProps) {
  const [selectedBands, setSelectedBands] = useState<number[]>([1, 2, 3]);
  const [cogBandCount, setCogBandCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rMinMax, setRMinMax] = useState<ChannelMinMax>({ min: 0, max: 10000 });
  const [gMinMax, setGMinMax] = useState<ChannelMinMax>({ min: 0, max: 10000 });
  const [bMinMax, setBMinMax] = useState<ChannelMinMax>({ min: 0, max: 10000 });

  // Histogram state
  const [activeChannel, setActiveChannel] = useState<number | null>(null);
  const [histogramCache, setHistogramCache] = useState<Record<number, BandHistogramResult>>({});
  const [histogramLoading, setHistogramLoading] = useState<Record<number, boolean>>({});
  const [histogramError, setHistogramError] = useState<Record<number, string | null>>({});
  const [noDataValue, setNoDataValue] = useState<number | undefined>(undefined);

  const bandLabels = (source.meta as any)?.bandLabels as string[] | undefined;

  // Find first COG source URL for band count
  const firstCogUrl = useMemo(() => {
    return (source.data || []).find((d: DataSourceItem) => d.format === 'cog')?.url;
  }, [source.data]);

  // Initialize state only when dialog opens
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const firstRgb = (source.data || []).find((d: DataSourceItem) => d.convertToRGB === true);
      const bands = firstRgb?.bands && firstRgb.bands.length >= 3
        ? firstRgb.bands.slice(0, 3)
        : [1, 2, 3];
      setSelectedBands(bands);
      setShowAdvanced(false);
      setActiveChannel(null);
      setHistogramCache({});
      setHistogramLoading({});
      setHistogramError({});

      // Initialize min/max from existing style variables
      const vars = (firstRgb as any)?.style?.variables;
      if (vars) {
        setRMinMax({ min: vars.rMin ?? 0, max: vars.rMax ?? 10000 });
        setGMinMax({ min: vars.gMin ?? 0, max: vars.gMax ?? 10000 });
        setBMinMax({ min: vars.bMin ?? 0, max: vars.bMax ?? 10000 });
      } else {
        setRMinMax({ min: 0, max: 10000 });
        setGMinMax({ min: 0, max: 10000 });
        setBMinMax({ min: 0, max: 10000 });
      }
    }
    prevOpenRef.current = open;
  }, [open, source.data]);

  // Fetch band count and noData from first COG
  useEffect(() => {
    if (!open || !firstCogUrl) return;
    let cancelled = false;
    setLoading(true);
    fetchCogHeaderMetadata(firstCogUrl)
      .then((meta) => {
        if (!cancelled) {
          if (meta.samplesPerPixel) setCogBandCount(meta.samplesPerPixel);
          setNoDataValue(meta.noDataValue);
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

  const hasAdvancedValues = rMinMax.min !== 0 || rMinMax.max !== 10000 ||
    gMinMax.min !== 0 || gMinMax.max !== 10000 ||
    bMinMax.min !== 0 || bMinMax.max !== 10000;

  const handleSave = () => {
    const updatedData = (source.data || []).map((d: DataSourceItem) => {
      if (d.format === 'cog') {
        const updated: any = { ...d, convertToRGB: true, bands: [...selectedBands] };
        if (hasAdvancedValues) {
          updated.style = buildRgbStyle(selectedBands, rMinMax, gMinMax, bMinMax);
        }
        return updated;
      }
      return d;
    });
    onUpdateDataSources(updatedData);
    onOpenChange(false);
  };

  const atLimit = selectedBands.length >= MAX_BANDS;

  const channelConfigs = [
    { label: 'Red', color: RGB_COLORS[0], band: selectedBands[0], minMax: rMinMax, setMinMax: setRMinMax },
    { label: 'Green', color: RGB_COLORS[1], band: selectedBands[1], minMax: gMinMax, setMinMax: setGMinMax },
    { label: 'Blue', color: RGB_COLORS[2], band: selectedBands[2], minMax: bMinMax, setMinMax: setBMinMax },
  ];

  // Fetch histogram for a channel
  const fetchHistogramForChannel = useCallback((channelIdx: number) => {
    const band = selectedBands[channelIdx];
    if (!band || !firstCogUrl) return;

    // Use band number as cache key
    if (histogramCache[band]) return;

    setHistogramLoading(prev => ({ ...prev, [band]: true }));
    setHistogramError(prev => ({ ...prev, [band]: null }));

    fetchBandHistogram(firstCogUrl, band - 1, noDataValue)
      .then((result) => {
        setHistogramCache(prev => ({ ...prev, [band]: result }));

        // Auto-populate min/max if at defaults
        const cfg = channelConfigs[channelIdx];
        if (cfg && cfg.minMax.min === 0 && cfg.minMax.max === 10000) {
          cfg.setMinMax({ min: Math.floor(result.min), max: Math.ceil(result.max) });
        }
      })
      .catch((err) => {
        setHistogramError(prev => ({
          ...prev,
          [band]: err instanceof Error ? err.message : 'Failed to load histogram',
        }));
      })
      .finally(() => {
        setHistogramLoading(prev => ({ ...prev, [band]: false }));
      });
  }, [selectedBands, firstCogUrl, noDataValue, histogramCache, channelConfigs]);

  const handleChannelClick = useCallback((channelIdx: number) => {
    setActiveChannel(channelIdx);
    fetchHistogramForChannel(channelIdx);
  }, [fetchHistogramForChannel]);

  // Derive active histogram data
  const activeBand = activeChannel !== null ? selectedBands[activeChannel] : null;
  const activeHistData = activeBand !== null ? histogramCache[activeBand] ?? null : null;
  const activeHistLoading = activeBand !== null ? histogramLoading[activeBand] ?? false : false;
  const activeHistError = activeBand !== null ? histogramError[activeBand] ?? null : null;
  const activeConfig = activeChannel !== null ? channelConfigs[activeChannel] : null;

  // Dialog width: wider when in advanced mode
  const dialogClass = showAdvanced
    ? "sm:max-w-[850px] max-h-[80vh] flex flex-col"
    : "sm:max-w-[600px] max-h-[80vh] flex flex-col";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>RGB Composite Editor</DialogTitle>
          <DialogDescription>
            Assign bands to the Red, Green, and Blue channels. Changes apply to all COG sources in this layer.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Loading band information…</div>
        ) : showAdvanced ? (
          /* ── Advanced Settings Panel ── */
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <Button
              variant="ghost"
              size="sm"
              className="self-start gap-1 text-xs text-muted-foreground hover:text-foreground -ml-2"
              onClick={() => { setShowAdvanced(false); setActiveChannel(null); }}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Band Selection
            </Button>

            <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: 320 }}>
              {/* Left: Channel list */}
              <div className="flex flex-col gap-1 w-[180px] flex-shrink-0">
                <div className="text-xs font-medium text-muted-foreground mb-1">Channels</div>
                {channelConfigs.map(({ label, color, band }, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleChannelClick(idx)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-left transition-colors ${
                      activeChannel === idx
                        ? 'border-primary bg-accent'
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <span
                      className="inline-flex items-center justify-center rounded text-[11px] font-bold text-white w-6 h-6 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {label[0]}
                    </span>
                    <span className="text-xs font-medium truncate">
                      {getBandLabel(band)}
                    </span>
                  </button>
                ))}
                <p className="text-[10px] text-muted-foreground mt-2">
                  Click a channel to view its pixel distribution and set min/max thresholds.
                </p>
              </div>

              {/* Right: Histogram */}
              <div className="flex-1 flex flex-col min-w-0 border-l pl-4">
                {activeChannel === null ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    Click a channel to view its pixel distribution
                  </div>
                ) : activeConfig ? (
                  <BandHistogram
                    data={activeHistData?.bins ?? null}
                    loading={activeHistLoading}
                    error={activeHistError}
                    channelColor={activeConfig.color}
                    channelLabel={activeConfig.label[0]}
                    bandLabel={`${getBandLabel(activeConfig.band)} – ${activeConfig.label} Channel`}
                    dataMin={activeHistData?.min ?? 0}
                    dataMax={activeHistData?.max ?? 1}
                    min={activeConfig.minMax.min}
                    max={activeConfig.minMax.max}
                     onMinChange={(v) => activeConfig.setMinMax({ ...activeConfig.minMax, min: v })}
                     onMaxChange={(v) => activeConfig.setMinMax({ ...activeConfig.minMax, max: v })}
                     onStretch={(newMin, newMax) => activeConfig.setMinMax({ min: newMin, max: newMax })}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          /* ── Band Selection Panel ── */
          <>
            <div className="flex gap-2 items-stretch h-[320px] flex-shrink-0">
              {/* Available Bands */}
              <div className="flex-1 min-w-0 flex flex-col">
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
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Selected Bands ({selectedBands.length}/{MAX_BANDS})
                </div>
                <div className="flex border rounded-md overflow-hidden">
                  {/* Fixed R/G/B channel labels */}
                  <div className="flex flex-col bg-muted/50 border-r">
                    {RGB_LABELS.map((label, i) => (
                      <div
                        key={label}
                        className="flex items-center justify-center px-1.5 h-[34px]"
                      >
                        <span
                          className="inline-flex items-center justify-center rounded text-[11px] font-bold text-white w-5 h-5 flex-shrink-0"
                          style={{ backgroundColor: RGB_COLORS[i] }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Sortable band rows */}
                  <ScrollArea className="flex-1">
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
                          Select 3 bands for RGB composite. The first band selected will use Red, the second Blue, the third Green. The order can be changed after selection.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Advanced Settings button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                  disabled={selectedBands.length !== MAX_BANDS}
                  onClick={() => setShowAdvanced(true)}
                >
                  <Settings className="h-3 w-3" />
                  Advanced Settings &gt;&gt;&gt;
                </Button>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={selectedBands.length !== MAX_BANDS}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
