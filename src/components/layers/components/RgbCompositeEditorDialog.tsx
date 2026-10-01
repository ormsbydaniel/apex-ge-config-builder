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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  RGB_RECIPES, SENSOR_NAMES, STRETCH_METHODS, computeStretch, guessSensor, matchRecipe, resolveRecipeBands,
  type RgbRecipeId, type StretchMethod,
} from '@/utils/rgbComposite/recipes';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { fetchCogHeaderMetadata, fetchBandHistogram, BandHistogramResult } from '@/utils/cogMetadata';
import { BandHistogram } from './BandHistogram';
import CompositeGallery, { RECIPE_ICONS, INDEX_ICONS } from './CompositeGallery';
import {
  INDEX_RECIPES, INDEX_COLORMAPS, INDEX_RANGE_PRESETS, buildIndexStyle, matchIndexRecipe, resolveIndexBands, indexColorStops,
  type IndexRecipeId, type SpectralIndexConfig,
} from '@/utils/rgbComposite/indices';
import { createGradientCSS } from '@/utils/colormapUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

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
  const [selectedBands, setSelectedBands] = useState<(number | null)[]>([1, 2, 3]);
  const [view, setView] = useState<'gallery' | 'editor'>('editor');
  // True when this session started on the gallery (no existing composite).
  const [startedOnGallery, setStartedOnGallery] = useState(false);
  const [cogBandCount, setCogBandCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [rMinMax, setRMinMax] = useState<ChannelMinMax>({ min: 0, max: 10000 });
  const [gMinMax, setGMinMax] = useState<ChannelMinMax>({ min: 0, max: 10000 });
  const [bMinMax, setBMinMax] = useState<ChannelMinMax>({ min: 0, max: 10000 });

  // Histogram state
  const [histogramCache, setHistogramCache] = useState<Record<number, BandHistogramResult>>({});
  const [histogramLoading, setHistogramLoading] = useState<Record<number, boolean>>({});
  const [histogramError, setHistogramError] = useState<Record<number, string | null>>({});
  const [noDataValue, setNoDataValue] = useState<number | undefined>(undefined);
  const [stretchMethod, setStretchMethod] = useState<StretchMethod>('percent-2-98');
  // True once the user edits a min/max by hand; the dropdown then shows "Custom".
  const [stretchCustom, setStretchCustom] = useState(false);
  // Channels (0=R,1=G,2=B) waiting for their band's histogram to apply the active stretch.
  const [pendingStretch, setPendingStretch] = useState<number[]>([]);
  const [stretchError, setStretchError] = useState<string | null>(null);

  // Spectral index mode
  const [mode, setMode] = useState<'rgb' | 'index'>('rgb');
  const [indexRecipe, setIndexRecipe] = useState<IndexRecipeId>('ndvi');
  const [indexBands, setIndexBands] = useState<(number | null)[]>([null, null]);
  const [indexColormap, setIndexColormap] = useState('greens');
  const [indexReverse, setIndexReverse] = useState(false);
  const [indexMin, setIndexMin] = useState(-1);
  const [indexMax, setIndexMax] = useState(1);

  const queueStretch = (channels: number[]) => {
    setPendingStretch((prev) => Array.from(new Set([...prev, ...channels])));
  };

  const loadIndexConfig = (cfg: SpectralIndexConfig) => {
    setMode('index');
    setIndexRecipe(cfg.recipe);
    setIndexBands([cfg.bandA, cfg.bandB]);
    setIndexColormap(cfg.colormap);
    setIndexReverse(!!cfg.reverse);
    setIndexMin(cfg.min);
    setIndexMax(cfg.max);
  };

  // Band labels: layer meta wins, otherwise fall back to labels extracted from
  // STAC eo:bands metadata stored on the first COG data item.
  const bandLabels = useMemo(() => {
    const fromMeta = (source.meta as any)?.bandLabels as string[] | undefined;
    if (fromMeta && fromMeta.some(Boolean)) return fromMeta;
    const fromItem = (source.data || []).find(
      (d: DataSourceItem) => d.format === 'cog' && d.bandLabels?.some(Boolean),
    )?.bandLabels;
    return fromItem;
  }, [source.meta, source.data]);

  // Find first COG source URL for band count
  const firstCogUrl = useMemo(() => {
    return (source.data || []).find((d: DataSourceItem) => d.format === 'cog')?.url;
  }, [source.data]);

  const inFlightRef = React.useRef<Set<number>>(new Set());
  const selectedBandsRef = React.useRef(selectedBands);
  selectedBandsRef.current = selectedBands;

  // Initialize state only when dialog opens
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const firstRgb = (source.data || []).find((d: DataSourceItem) => d.convertToRGB === true);
      const firstIndex = (source.data || []).find((d: DataSourceItem) => d.format === 'cog' && d.spectralIndex);
      const hasExisting = !!firstRgb || !!firstIndex;
      setView(hasExisting ? 'editor' : 'gallery');
      setStartedOnGallery(!hasExisting);
      setMode('rgb');
      if (firstIndex) loadIndexConfig(firstIndex.spectralIndex as SpectralIndexConfig);
      const bands = firstRgb?.bands && firstRgb.bands.length >= 3
        ? firstRgb.bands.slice(0, 3)
        : [1, 2, 3];
      setSelectedBands(bands);
      setStretchError(null);
      inFlightRef.current = new Set();
      setHistogramCache({});
      setHistogramLoading({});
      setHistogramError({});

      // Initialize min/max from existing style variables (shown as "Custom"),
      // otherwise auto-apply the default stretch once histograms load.
      const vars = (firstRgb as any)?.style?.variables;
      if (vars) {
        setRMinMax({ min: vars.rMin ?? 0, max: vars.rMax ?? 10000 });
        setGMinMax({ min: vars.gMin ?? 0, max: vars.gMax ?? 10000 });
        setBMinMax({ min: vars.bMin ?? 0, max: vars.bMax ?? 10000 });
        setStretchCustom(true);
        setPendingStretch([]);
      } else {
        setRMinMax({ min: 0, max: 10000 });
        setGMinMax({ min: 0, max: 10000 });
        setBMinMax({ min: 0, max: 10000 });
        setStretchMethod('percent-2-98');
        setStretchCustom(false);
        setPendingStretch([0, 1, 2]);
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

  const getBandLabel = (band: number) => {
    const label = bandLabels?.[band - 1];
    return label ? `Band ${band} (${label})` : `Band ${band}`;
  };

  /** Assign a band to a channel; if another channel already uses it, swap them. */
  const assignBand = (channelIdx: number, band: number) => {
    const next: (number | null)[] = [selectedBands[0] ?? null, selectedBands[1] ?? null, selectedBands[2] ?? null];
    const changed = new Set<number>([channelIdx]);
    const other = next.indexOf(band);
    if (other !== -1 && other !== channelIdx) {
      next[other] = next[channelIdx];
      changed.add(other);
    }
    next[channelIdx] = band;
    setSelectedBands(next);
    // Re-stretch the affected channels with the active method (2–98% when "Custom").
    queueStretch(Array.from(changed));
  };

  const hasAdvancedValues = rMinMax.min !== 0 || rMinMax.max !== 10000 ||
    gMinMax.min !== 0 || gMinMax.max !== 10000 ||
    bMinMax.min !== 0 || bMinMax.max !== 10000;

  const allChannelsSet = selectedBands.length === MAX_BANDS && selectedBands.every((b) => b != null);

  const handleSave = () => {
    if (!allChannelsSet) return;
    const bands = selectedBands as number[];
    const updatedData = (source.data || []).map((d: DataSourceItem) => {
      if (d.format === 'cog') {
        const updated: any = { ...d, convertToRGB: true, bands: [...bands] };
        if (hasAdvancedValues) {
          updated.style = buildRgbStyle(rMinMax, gMinMax, bMinMax);
        }
        return updated;
      }
      return d;
    });
    onUpdateDataSources(updatedData);
    onOpenChange(false);
  };

  /** Manual edits to a channel range switch the stretch dropdown to "Custom". */
  const editRange = (
    setter: React.Dispatch<React.SetStateAction<{ min: number; max: number }>>,
    channelIdx: number,
    update: React.SetStateAction<{ min: number; max: number }>,
  ) => {
    setPendingStretch((prev) => prev.filter((c) => c !== channelIdx));
    setStretchCustom(true);
    setter(update);
  };

  const channelConfigs = [
    { label: 'Red', color: RGB_COLORS[0], band: selectedBands[0], minMax: rMinMax, setMinMax: setRMinMax },
    { label: 'Green', color: RGB_COLORS[1], band: selectedBands[1], minMax: gMinMax, setMinMax: setGMinMax },
    { label: 'Blue', color: RGB_COLORS[2], band: selectedBands[2], minMax: bMinMax, setMinMax: setBMinMax },
  ];

  // Load histograms for every assigned band (stacked view shows all three)
  useEffect(() => {
    if (!open || loading || !firstCogUrl) return;
    selectedBands.forEach((band) => {
      if (band == null || histogramCache[band] || inFlightRef.current.has(band)) return;
      inFlightRef.current.add(band);
      setHistogramLoading((prev) => ({ ...prev, [band]: true }));
      setHistogramError((prev) => ({ ...prev, [band]: null }));
      fetchBandHistogram(firstCogUrl, band - 1, noDataValue)
        .then((result) => {
          setHistogramCache((prev) => ({ ...prev, [band]: result }));
        })
        .catch((err) => {
          setHistogramError((prev) => ({
            ...prev,
            [band]: err instanceof Error ? err.message : 'Failed to load histogram',
          }));
        })
        .finally(() => {
          inFlightRef.current.delete(band);
          setHistogramLoading((prev) => ({ ...prev, [band]: false }));
        });
    });
  }, [open, loading, firstCogUrl, noDataValue, selectedBands, histogramCache]);

  // Apply the active stretch to queued channels as soon as their histogram is available.
  useEffect(() => {
    if (!pendingStretch.length) return;
    const setters = [setRMinMax, setGMinMax, setBMinMax];
    const remaining: number[] = [];
    pendingStretch.forEach((ch) => {
      const band = selectedBands[ch];
      const hist = band ? histogramCache[band] : undefined;
      if (hist) setters[ch](computeStretch(stretchMethod, hist));
      else if (band && !histogramError[band]) remaining.push(ch);
    });
    if (remaining.length !== pendingStretch.length) setPendingStretch(remaining);
  }, [pendingStretch, histogramCache, histogramError, selectedBands, stretchMethod]);

  // ── Recipes & auto-stretch ──
  const sensor = guessSensor(cogBandCount);
  const currentRecipe = useMemo(
    () => (allChannelsSet ? matchRecipe(selectedBands as number[], cogBandCount, bandLabels) : 'custom'),
    [selectedBands, cogBandCount, bandLabels, allChannelsSet]
  );

  const applyRecipe = (id: RgbRecipeId) => {
    setStretchError(null);
    if (id === 'custom') {
      // Start from a blank slate: clear channels, ranges and histograms.
      setSelectedBands([null, null, null]);
      setRMinMax({ min: 0, max: 10000 });
      setGMinMax({ min: 0, max: 10000 });
      setBMinMax({ min: 0, max: 10000 });
      setHistogramCache({});
      setHistogramLoading({});
      setHistogramError({});
      inFlightRef.current = new Set();
      setPendingStretch([]);
      setStretchCustom(false);
      return;
    }
    const bands = resolveRecipeBands(id, cogBandCount, bandLabels);
    if (!bands) return;
    setSelectedBands([...bands]);
    setStretchCustom(false);
    queueStretch([0, 1, 2]);
  };

  /** Choosing a stretch method re-applies it to all three channels. */
  const chooseStretchMethod = (value: string) => {
    if (value === 'custom') return;
    setStretchMethod(value as StretchMethod);
    setStretchCustom(false);
    queueStretch([0, 1, 2]);
  };

  /** Gallery card picked: apply the recipe and enter the editor. */
  const handleGalleryPick = (id: RgbRecipeId) => {
    applyRecipe(id);
    setView('editor');
  };

  const sectionLabel = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>RGB Composite Editor</DialogTitle>
          <DialogDescription>
            Choose a composite, assign bands to Red, Green and Blue, then set each channel's range. Changes apply to all COG sources in this layer.
          </DialogDescription>
        </DialogHeader>

        {view === 'gallery' ? (
          <ScrollArea className="flex-1 min-h-0 pr-3">
            <CompositeGallery
              bandCount={cogBandCount}
              bandLabels={bandLabels}
              loading={loading}
              onPick={handleGalleryPick}
            />
          </ScrollArea>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading band information…
          </div>
        ) : (
          <TooltipProvider delayDuration={400}>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 flex-1 min-h-0">
              {/* ── Left pane: composite, channels, stretch ── */}
              <ScrollArea className="min-h-0 pr-3">
                <div className="space-y-5">
                  {startedOnGallery && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setView('gallery')}
                    >
                      ← Back to composites
                    </button>
                  )}
                  <div className="space-y-2">
                    <div className={sectionLabel}>
                      Composite
                      {sensor && <span className="normal-case tracking-normal font-normal ml-2">· detected {SENSOR_NAMES[sensor]}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      {RGB_RECIPES.map((r) => {
                        const Icon = RECIPE_ICONS[r.id];
                        const bands = resolveRecipeBands(r.id, cogBandCount, bandLabels);
                        const unavailable = r.id !== 'custom' && !bands;
                        const active = currentRecipe === r.id;
                        return (
                          <Tooltip key={r.id}>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={active ? 'default' : 'outline'}
                                  className="h-8 w-full justify-between text-xs"
                                  disabled={unavailable}
                                  onClick={() => applyRecipe(r.id)}
                                >
                                  <span className="flex items-center gap-1.5 min-w-0">
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{r.name}</span>
                                  </span>
                                  {bands && <span className="opacity-70 font-normal">{bands.join('-')}</span>}
                                </Button>
                                {active && !unavailable && (
                                  <p className="text-[11px] text-muted-foreground mt-1 px-1">{r.description}</p>
                                )}
                              </span>
                            </TooltipTrigger>
                            {!active && (
                              <TooltipContent side="right" className="max-w-[240px]">
                                <p>{unavailable ? `${r.description} Not available — this source lacks the required bands or band labels.` : r.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className={sectionLabel}>Channels</div>
                    {CHANNEL_NAMES.map((name, i) => (
                      <div key={name} className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center rounded text-[11px] font-bold text-primary-foreground w-6 h-6 flex-shrink-0"
                          style={{ backgroundColor: RGB_COLORS[i] }}
                          aria-label={name}
                        >
                          {RGB_LABELS[i]}
                        </span>
                        <Select
                          value={selectedBands[i] ? String(selectedBands[i]) : undefined}
                          onValueChange={(v) => assignBand(i, Number(v))}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1" aria-label={`${name} channel band`}>
                            <SelectValue placeholder="Choose a band" />
                          </SelectTrigger>
                          <SelectContent>
                            {allBands.map((b) => (
                              <SelectItem key={b} value={String(b)} className="text-xs">{getBandLabel(b)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <p className="text-[11px] text-muted-foreground">Picking a band already used by another channel swaps the two.</p>
                  </div>

                  <div className="space-y-2">
                    <div className={sectionLabel}>Contrast stretch (all bands)</div>
                    <Select value={stretchCustom ? 'custom' : stretchMethod} onValueChange={chooseStretchMethod}>
                      <SelectTrigger className="h-8 w-full text-xs" aria-label="Contrast stretch (all bands)"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STRETCH_METHODS.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                        ))}
                        <SelectItem value="custom" disabled className="text-xs">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {stretchCustom
                        ? 'Ranges differ per band or were set by hand. Pick a method to re-apply it to every band.'
                        : STRETCH_METHODS.find((m) => m.id === stretchMethod)?.description}
                    </p>
                    {stretchError && <p className="text-[11px] text-destructive">{stretchError}</p>}
                  </div>
                </div>
              </ScrollArea>

              {/* ── Right pane: stacked channel histograms ── */}
              <ScrollArea className="min-h-0 border-l pl-5 pr-3">
                <div className="space-y-2">
                  <div className={sectionLabel}>Channel ranges</div>
                  {!firstCogUrl ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No COG source to read pixel values from.</p>
                  ) : selectedBands.every((b) => b == null) ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Assign a band to a channel to see its histogram.</p>
                  ) : (
                    <div className="space-y-6">
                      {channelConfigs.map((cfg, i) => {
                        const band = cfg.band;
                        if (!band) return null;
                        const hist = histogramCache[band] ?? null;
                        return (
                          <div key={cfg.label} className="flex flex-col">
                            <BandHistogram
                              data={hist?.bins ?? null}
                              loading={histogramLoading[band] ?? !hist}
                              error={histogramError[band] ?? null}
                              channelColor={cfg.color}
                              channelLabel={RGB_LABELS[i]}
                              bandLabel={`${getBandLabel(band)} – ${cfg.label}`}
                              dataMin={hist?.min ?? 0}
                              dataMax={hist?.max ?? 1}
                              min={cfg.minMax.min}
                              max={cfg.minMax.max}
                              onMinChange={(v) => editRange(cfg.setMinMax, i, (mm) => ({ ...mm, min: v }))}
                              onMaxChange={(v) => editRange(cfg.setMinMax, i, (mm) => ({ ...mm, max: v }))}
                              onStretch={(lo, hi) => editRange(cfg.setMinMax, i, { min: lo, max: hi })}
                              stretchOptions={hist ? STRETCH_METHODS.map((m) => ({
                                id: m.id,
                                label: m.shortName,
                                description: m.description,
                                onApply: () => editRange(cfg.setMinMax, i, computeStretch(m.id, hist)),
                              })) : undefined}
                              chartHeight={110}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TooltipProvider>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {view === 'editor' && (
            <Button onClick={handleSave} disabled={!allChannelsSet}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
