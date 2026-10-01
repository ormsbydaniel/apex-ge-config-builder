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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Loader2 } from 'lucide-react';
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
  const [selectedBands, setSelectedBands] = useState<number[]>([1, 2, 3]);
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
  const [stretching, setStretching] = useState(false);
  const [stretchSummary, setStretchSummary] = useState<string | null>(null);
  const [stretchError, setStretchError] = useState<string | null>(null);

  const queueStretch = (channels: number[]) => {
    setPendingStretch((prev) => Array.from(new Set([...prev, ...channels])));
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
      const bands = firstRgb?.bands && firstRgb.bands.length >= 3
        ? firstRgb.bands.slice(0, 3)
        : [1, 2, 3];
      setSelectedBands(bands);
      setStretchSummary(null);
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
    setStretchSummary(null);
    const next = [...selectedBands];
    while (next.length < MAX_BANDS) next.push(allBands.find((b) => !next.includes(b)) ?? 1);
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

  const handleSave = () => {
    const updatedData = (source.data || []).map((d: DataSourceItem) => {
      if (d.format === 'cog') {
        const updated: any = { ...d, convertToRGB: true, bands: [...selectedBands] };
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
    setStretchSummary(null);
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
      if (histogramCache[band] || inFlightRef.current.has(band)) return;
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
    () => (selectedBands.length === MAX_BANDS ? matchRecipe(selectedBands, cogBandCount, bandLabels) : 'custom'),
    [selectedBands, cogBandCount, bandLabels]
  );

  const applyRecipe = (id: RgbRecipeId) => {
    setStretchSummary(null);
    if (id === 'custom') return;
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
    setStretchSummary(null);
    queueStretch([0, 1, 2]);
  };

  const stretchAll = async () => {
    if (!firstCogUrl || selectedBands.length !== MAX_BANDS) return;
    setStretching(true);
    setStretchError(null);
    try {
      const results = await Promise.all(
        selectedBands.map(async (band) => {
          if (histogramCache[band]) return histogramCache[band];
          const r = await fetchBandHistogram(firstCogUrl, band - 1, noDataValue);
          setHistogramCache((prev) => ({ ...prev, [band]: r }));
          return r;
        })
      );
      const setters = [setRMinMax, setGMinMax, setBMinMax];
      setPendingStretch([]);
      results.forEach((hist, i) => setters[i](computeStretch(stretchMethod, hist)));
      setStretchCustom(false);
      setStretchSummary(`Applied ${STRETCH_METHODS.find((m) => m.id === stretchMethod)?.name} to R, G and B`);
    } catch (err) {
      setStretchError(err instanceof Error ? err.message : 'Could not read pixel values');
    } finally {
      setStretching(false);
    }
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

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading band information…
          </div>
        ) : (
          <TooltipProvider delayDuration={400}>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 flex-1 min-h-0">
              {/* ── Left pane: composite, channels, stretch ── */}
              <ScrollArea className="min-h-0 pr-3">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className={sectionLabel}>
                      Composite
                      {sensor && <span className="normal-case tracking-normal font-normal ml-2">· detected {SENSOR_NAMES[sensor]}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      {RGB_RECIPES.map((r) => {
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
                                  <span>{r.name}</span>
                                  {bands && <span className="opacity-70 font-normal">{bands.join('-')}</span>}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[240px]">
                              <p>{unavailable ? `${r.description} Not available — this source lacks the required bands or band labels.` : r.description}</p>
                            </TooltipContent>
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
                    <div className={sectionLabel}>Contrast stretch</div>
                    <div className="flex items-center gap-2">
                      <Select value={stretchMethod} onValueChange={(v) => setStretchMethod(v as StretchMethod)}>
                        <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STRETCH_METHODS.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs gap-1"
                        disabled={selectedBands.length !== MAX_BANDS || !firstCogUrl || stretching}
                        onClick={stretchAll}
                      >
                        <Wand2 className="h-3 w-3" />
                        {stretching ? 'Stretching…' : 'Stretch all'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {STRETCH_METHODS.find((m) => m.id === stretchMethod)?.description}
                    </p>
                    {stretchSummary && <p className="text-[11px] text-muted-foreground">{stretchSummary}</p>}
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
                              onMinChange={(v) => cfg.setMinMax((mm) => ({ ...mm, min: v }))}
                              onMaxChange={(v) => cfg.setMinMax((mm) => ({ ...mm, max: v }))}
                              onStretch={(lo, hi) => cfg.setMinMax({ min: lo, max: hi })}
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
          <Button onClick={handleSave} disabled={selectedBands.length !== MAX_BANDS}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
