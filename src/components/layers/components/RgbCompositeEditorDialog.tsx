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
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  applyToScope, cogIndices, datasetLabel, firstCogIndex,
} from '@/utils/rgbComposite/perDataset';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  RGB_RECIPES, SENSOR_NAMES, STRETCH_METHODS, computeStretch, guessSensor, matchRecipe, resolveRecipeBands, sharedStretchMethod,
  type RgbRecipeId, type StretchMethod,
} from '@/utils/rgbComposite/recipes';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { fetchCogHeaderMetadata, BandHistogramResult } from '@/utils/cogMetadata';
import { getHistogram, peekStretch } from '@/utils/rgbComposite/histogramCache';
import { BandHistogram } from './BandHistogram';
import CompositeGallery, { RECIPE_ICONS, INDEX_ICONS } from './CompositeGallery';
import {
  INDEX_RECIPES, INDEX_COLORMAPS, indexRangePresets, buildIndexStyle, matchIndexRecipe, resolveIndexBands, indexColorStops,
  type IndexRecipeId, type SpectralIndexConfig,
} from '@/utils/rgbComposite/indices';
import { createGradientCSS } from '@/utils/colormapUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { applyCompositeStyle, visualisationName } from '@/utils/rgbComposite/styleScope';

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
  const [homeTab, setHomeTab] = useState<'rgb' | 'index'>('rgb');
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
  // Saved numeric ranges do not retain their originating method.
  const [channelMethods, setChannelMethods] = useState<(StretchMethod | null)[]>(['percent-2-98', 'percent-2-98', 'percent-2-98']);
  const sharedMethod = sharedStretchMethod(channelMethods);
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

  // Per-dataset scope: index into source.data of the COG being edited.
  const [scope, setScope] = useState(0);
  const cogIdx = useMemo(() => cogIndices(source.data || []), [source.data]);
  const firstIdx = cogIdx[0] ?? 0;
  const multiDataset = cogIdx.length > 1;
  const isFirstScope = scope === firstIdx;
  const scopePos = cogIdx.indexOf(scope);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const batchAbortRef = React.useRef<AbortController | null>(null);
  const [applyAll, setApplyAll] = useState(false);
  const [styleScope, setStyleScope] = useState<'this' | 'all'>('this');
  const [styleDirty, setStyleDirty] = useState(false);
  const [rangeDirty, setRangeDirty] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<(() => void) | null>(null);

  const askStyleScope = (change: () => void) => {
    if (!multiDataset) { change(); return; }
    setPendingStyle(() => change);
  };
  const confirmStyleScope = (choice: 'this' | 'all') => {
    setStyleScope(choice);
    setStyleDirty(true);
    pendingStyle?.();
    setPendingStyle(null);
  };

  // URL of the COG being edited (drives band count, noData and histograms)
  const firstCogUrl = useMemo(() => {
    const item = source.data?.[scope];
    if (item?.format === 'cog') return item.url;
    return (source.data || []).find((d: DataSourceItem) => d.format === 'cog')?.url;
  }, [source.data, scope]);

  const inFlightRef = React.useRef<Set<number>>(new Set());
  const selectedBandsRef = React.useRef(selectedBands);
  selectedBandsRef.current = selectedBands;

  /** Load the editor state from one data item. */
  const loadFromItem = (item: DataSourceItem | undefined, setInitialView: boolean) => {
    const rgbItem = item?.convertToRGB === true ? item : undefined;
    const indexItem = item?.format === 'cog' && item?.spectralIndex ? item : undefined;
    const hasExisting = !!rgbItem || !!indexItem;
    if (setInitialView) setView(hasExisting ? 'editor' : 'gallery');
    setHomeTab(indexItem ? 'index' : 'rgb');
    setMode('rgb');
    if (indexItem) loadIndexConfig(indexItem.spectralIndex as SpectralIndexConfig);
    const bands = rgbItem?.bands && rgbItem.bands.length >= 3 ? rgbItem.bands.slice(0, 3) : [1, 2, 3];
    setSelectedBands(bands);
    setStretchError(null);
    inFlightRef.current = new Set();
    setHistogramCache({});
    setHistogramLoading({});
    setHistogramError({});

    // Initialize min/max from existing style variables (shown as "Custom"),
    // otherwise auto-apply the default stretch once histograms load.
    const vars = (rgbItem as any)?.style?.variables;
    if (vars) {
      setRMinMax({ min: vars.rMin ?? 0, max: vars.rMax ?? 10000 });
      setGMinMax({ min: vars.gMin ?? 0, max: vars.gMax ?? 10000 });
      setBMinMax({ min: vars.bMin ?? 0, max: vars.bMax ?? 10000 });
      setStretchMethod('percent-2-98');
      setChannelMethods([null, null, null]);
      setPendingStretch([]);
    } else {
      setRMinMax({ min: 0, max: 10000 });
      setGMinMax({ min: 0, max: 10000 });
      setBMinMax({ min: 0, max: 10000 });
      setStretchMethod('percent-2-98');
      setChannelMethods(['percent-2-98', 'percent-2-98', 'percent-2-98']);
      setPendingStretch([0, 1, 2]);
    }
  };

  // Initialize state only when dialog opens
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const data = source.data || [];
      const first = firstCogIndex(data);
      setScope(first < 0 ? 0 : first);
      setBatchMessage(null);
      setBatchProgress(null);
      setApplyAll(first >= 0 && data[first]?.styleSource === 'batch');
      setStyleScope('this');
      setStyleDirty(false);
      setRangeDirty(false);
      setPendingStyle(null);
      loadFromItem(first < 0 ? undefined : data[first], true);
    }
    if (!open && prevOpenRef.current) batchAbortRef.current?.abort();
    prevOpenRef.current = open;
  }, [open, source.data]);

  const changeScope = (i: number) => {
    if (i === scope || i < 0) return;
    setScope(i);
    setBatchMessage(null);
    setStyleScope('this');
    setStyleDirty(false);
    setRangeDirty(false);
    loadFromItem(source.data[i], false);
    setView('editor');
  };

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
    // Re-stretch affected channels with their own methods (2–98% for an untracked range).
    setChannelMethods((prev) => prev.map((method, i) => changed.has(i) ? (method ?? stretchMethod) : method));
    queueStretch(Array.from(changed));
  };

  const hasAdvancedValues = rMinMax.min !== 0 || rMinMax.max !== 10000 ||
    gMinMax.min !== 0 || gMinMax.max !== 10000 ||
    bMinMax.min !== 0 || bMinMax.max !== 10000;

  const allChannelsSet = selectedBands.length === MAX_BANDS && selectedBands.every((b) => b != null);
  const indexReady = indexBands[0] != null && indexBands[1] != null && indexBands[0] !== indexBands[1] && indexMax > indexMin;
  const canSave = mode === 'index' ? indexReady : allChannelsSet;

  const handleSave = (close = true) => {
    if (!canSave) return;
    const data = source.data || [];
    let transform: (d: DataSourceItem) => DataSourceItem;
    if (mode === 'index') {
      const cfg: SpectralIndexConfig = {
        recipe: indexRecipe,
        bandA: indexBands[0] as number,
        bandB: indexBands[1] as number,
        colormap: indexColormap,
        reverse: indexReverse,
        min: indexMin,
        max: indexMax,
      };
      // The viewer loads only `bands` and renumbers them 1..n, so the style reads bands 1 and 2.
      transform = (d) => {
        const { convertToRGB, bands, ...rest } = d as any;
        return { ...rest, bands: [cfg.bandA, cfg.bandB], style: buildIndexStyle(cfg), spectralIndex: { ...cfg } } as DataSourceItem;
      };
    } else {
      const bands = selectedBands as number[];
      transform = (d) => {
        const { spectralIndex, ...rest } = d as any;
        const updated: any = { ...rest, convertToRGB: true, bands: [...bands] };
        if (hasAdvancedValues) {
          updated.style = buildRgbStyle(rMinMax, gMinMax, bMinMax);
        } else if (spectralIndex) {
          delete updated.style;
        }
        return updated;
      };
    }
    const effectiveScope = data[scope]?.format === 'cog' ? scope : firstCogIndex(data);
    if (mode === 'rgb') {
      // Batch stretch writes its own per-item styles immediately; saving without
      // further edits must not turn a batch dataset into an own-style override.
      if (!styleDirty && !rangeDirty) {
        if (close) onOpenChange(false);
        return;
      }
      const bands = selectedBands as number[];
      const styled = applyCompositeStyle(data, effectiveScope, bands, styleDirty && styleScope === 'all', (item) => {
        if (effectiveScope === data.indexOf(item)) return rangeDirty || styleDirty ? buildRgbStyle(rMinMax, gMinMax, bMinMax) : item.style;
        return item.style ?? buildRgbStyle(rMinMax, gMinMax, bMinMax);
      }, styleDirty, rangeDirty);
      onUpdateDataSources(styled);
      setStyleDirty(false);
      setRangeDirty(false);
    } else {
      onUpdateDataSources(applyToScope(data, effectiveScope, transform));
    }
    if (close) onOpenChange(false);
  };

  /** Compute the chosen stretch from each dataset's own pixels (skips datasets with own settings). */
  const applyToAllDatasets = async (method: StretchMethod | null = sharedMethod, channel?: number) => {
    if (!method || !allChannelsSet) return;
    const data = source.data || [];
    const targets = cogIdx.filter((i) => (i === scope && mode === 'rgb') || (data[i].convertToRGB && !data[i].spectralIndex))
      .map((i) => ({ index: i, url: data[i].url as string,
        bands: i === scope ? selectedBands as number[] : (data[i].bands?.slice(0, 3) ?? []) }));
    const validTargets = targets.filter((t) => t.bands.length === 3 && t.bands.every((b) => typeof b === 'number'));
    batchAbortRef.current?.abort();
    const ctrl = new AbortController();
    batchAbortRef.current = ctrl;
    setBatchMessage(null);
    // Fully cached: apply instantly without a progress indicator.
    const cached = validTargets.map((t) => t.bands.map((b, j) => channel == null || channel === j ? peekStretch(t.url, b - 1, noDataValue, method) : { min: 0, max: 0 }));
    const allCached = cached.every((r) => r.every(Boolean));
    if (!allCached) setBatchProgress({ done: 0, total: validTargets.length });
    const results = allCached
      ? validTargets.map((t, k) => ({ index: t.index, ranges: cached[k] as { min: number; max: number }[], error: undefined as string | undefined }))
      : await (async () => {
        let next = 0;
        let done = 0;
        const results: { index: number; ranges?: { min: number; max: number }[]; error?: string }[] = [];
        await Promise.all(Array.from({ length: Math.min(3, validTargets.length) }, async () => {
          while (next < validTargets.length && !ctrl.signal.aborted) {
            const target = validTargets[next++];
            try {
              const ranges = await Promise.all(target.bands.map(async (b, j) => channel == null || channel === j
                ? computeStretch(method, await getHistogram(target.url, b - 1, noDataValue)) : { min: 0, max: 0 }));
              results.push({ index: target.index, ranges });
            } catch (e) { results.push({ index: target.index, error: e instanceof Error ? e.message : 'Failed' }); }
            setBatchProgress({ done: ++done, total: validTargets.length });
          }
        }));
        return results;
      })();
    setBatchProgress(null);
    if (ctrl.signal.aborted) return;
    const byIndex = new Map(results.map((r) => [r.index, r]));
    const failed = results.filter((r) => r.error).length;
    const next = data.map((d, i) => {
      const r = byIndex.get(i);
      if (!r?.ranges) return d;
      const { spectralIndex, batchStretch, ...rest } = d as any;
      const [rr, gg, bb] = r.ranges;
      const prior = (d.style as { variables?: Record<string, number> } | undefined)?.variables;
      const current = [{ min: prior?.rMin ?? rMinMax.min, max: prior?.rMax ?? rMinMax.max },
        { min: prior?.gMin ?? gMinMax.min, max: prior?.gMax ?? gMinMax.max },
        { min: prior?.bMin ?? bMinMax.min, max: prior?.bMax ?? bMinMax.max }];
      const ranges = channel == null ? [rr, gg, bb] : current.map((range, j) => j === channel ? r.ranges?.[j] ?? range : range);
      return {
        ...rest,
        convertToRGB: true,
        bands: i === scope ? [...selectedBands] : [...(d.bands ?? selectedBands)],
        style: buildRgbStyle(ranges[0], ranges[1], ranges[2]),
        styleSource: i === firstIdx ? 'batch' : d.styleSource === 'own' ? 'own' : 'batch',
        ...(channel == null && d.styleSource !== 'own' ? { batchStretch: { method } } : {}),
      } as DataSourceItem;
    });
    onUpdateDataSources(next);
    const mine = byIndex.get(scope)?.ranges;
    if (mine) {
      if (channel == null || channel === 0) setRMinMax(mine[0]);
      if (channel == null || channel === 1) setGMinMax(mine[1]);
      if (channel == null || channel === 2) setBMinMax(mine[2]);
    }
    setRangeDirty(false);
    setBatchMessage(allCached && !failed ? null :
      `Stretch computed for ${results.length - failed} of ${validTargets.length} datasets` +
      (failed ? ` (${failed} failed and were left unchanged).` : '.'),
    );
  };

  // ── Spectral index actions ──
  const applyIndexRecipe = (id: IndexRecipeId) => {
    const r = INDEX_RECIPES.find((x) => x.id === id)!;
    setMode('index');
    setIndexRecipe(id);
    const bands = resolveIndexBands(id, cogBandCount, bandLabels);
    setIndexBands(bands ? [...bands] : [null, null]);
    setIndexColormap(r.colormap);
    setIndexReverse(r.reverse);
    setIndexMin(r.min);
    setIndexMax(r.max);
  };

  const assignIndexBand = (slot: number, band: number) => {
    const next = [...indexBands];
    const other = slot === 0 ? 1 : 0;
    if (next[other] === band) next[other] = next[slot];
    next[slot] = band;
    setIndexBands(next);
    if (next[0] != null && next[1] != null) {
      setIndexRecipe(matchIndexRecipe([next[0], next[1]], cogBandCount, bandLabels));
    }
  };

  const resetIndexRange = () => {
    const r = INDEX_RECIPES.find((x) => x.id === indexRecipe);
    if (r) { setIndexMin(r.min); setIndexMax(r.max); }
  };

  /** Manual edits to a channel range switch the stretch dropdown to "Custom". */
  const editRange = (
    setter: React.Dispatch<React.SetStateAction<{ min: number; max: number }>>,
    channelIdx: number,
    update: React.SetStateAction<{ min: number; max: number }>,
  ) => {
    setRangeDirty(true);
    setPendingStretch((prev) => prev.filter((c) => c !== channelIdx));
    setChannelMethods((prev) => prev.map((method, i) => i === channelIdx ? null : method));
    setter(update);
  };

  const applyChannelStretch = (channelIdx: number, method: StretchMethod, hist: BandHistogramResult) => {
    setRangeDirty(!applyAll);
    setPendingStretch((prev) => prev.filter((c) => c !== channelIdx));
    [setRMinMax, setGMinMax, setBMinMax][channelIdx](computeStretch(method, hist));
    setChannelMethods((prev) => prev.map((current, i) => i === channelIdx ? method : current));
    if (applyAll && multiDataset) void applyToAllDatasets(method, channelIdx);
  };

  const channelConfigs = [
    { label: 'Red', color: RGB_COLORS[0], band: selectedBands[0], minMax: rMinMax, setMinMax: setRMinMax },
    { label: 'Green', color: RGB_COLORS[1], band: selectedBands[1], minMax: gMinMax, setMinMax: setGMinMax },
    { label: 'Blue', color: RGB_COLORS[2], band: selectedBands[2], minMax: bMinMax, setMinMax: setBMinMax },
  ];

  // Load histograms for every assigned band (stacked view shows all three)
  useEffect(() => {
    if (!open || loading || !firstCogUrl || mode !== 'rgb') return;
    selectedBands.forEach((band) => {
      if (band == null || histogramCache[band] || inFlightRef.current.has(band)) return;
      inFlightRef.current.add(band);
      setHistogramLoading((prev) => ({ ...prev, [band]: true }));
      setHistogramError((prev) => ({ ...prev, [band]: null }));
      getHistogram(firstCogUrl, band - 1, noDataValue)
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
  }, [open, loading, firstCogUrl, noDataValue, selectedBands, histogramCache, mode]);

  // Apply the active stretch to queued channels as soon as their histogram is available.
  useEffect(() => {
    if (!pendingStretch.length) return;
    const setters = [setRMinMax, setGMinMax, setBMinMax];
    const remaining: number[] = [];
    pendingStretch.forEach((ch) => {
      const band = selectedBands[ch];
      const hist = band ? histogramCache[band] : undefined;
      if (hist) setters[ch](computeStretch(channelMethods[ch] ?? stretchMethod, hist));
      else if (band && !histogramError[band]) remaining.push(ch);
    });
    if (remaining.length !== pendingStretch.length) setPendingStretch(remaining);
  }, [pendingStretch, histogramCache, histogramError, selectedBands, stretchMethod, channelMethods]);

  // ── Recipes & auto-stretch ──
  const sensor = guessSensor(cogBandCount);
  const currentRecipe = useMemo(
    () => (allChannelsSet ? matchRecipe(selectedBands as number[], cogBandCount, bandLabels) : 'custom'),
    [selectedBands, cogBandCount, bandLabels, allChannelsSet]
  );

  const applyRecipe = (id: RgbRecipeId) => {
    setStretchError(null);
    if (id === 'custom') {
      setMode('rgb');
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
      setChannelMethods([null, null, null]);
      return;
    }
    const bands = resolveRecipeBands(id, cogBandCount, bandLabels);
    if (!bands) return;
    setMode('rgb');
    setSelectedBands([...bands]);
    setChannelMethods((prev) => prev.map((method) => method ?? stretchMethod));
    queueStretch([0, 1, 2]);
  };

  /** Choosing a stretch method re-applies it to all three channels. */
  const chooseStretchMethod = (value: string) => {
    if (value === 'custom') return;
    setRangeDirty(!applyAll);
    setStretchMethod(value as StretchMethod);
    setChannelMethods([value as StretchMethod, value as StretchMethod, value as StretchMethod]);
    queueStretch([0, 1, 2]);
    if (applyAll && multiDataset) void applyToAllDatasets(value as StretchMethod);
  };

  /** Gallery card picked: apply the recipe and enter the editor. */
  const handleGalleryPick = (id: RgbRecipeId) => {
    setStyleDirty(true);
    applyRecipe(id);
    setView('editor');
  };

  const handleGalleryPickIndex = (id: IndexRecipeId) => {
    applyIndexRecipe(id);
    setView('editor');
  };

  const sectionLabel = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';
  const indexStops = indexMax > indexMin ? indexColorStops(indexColormap, indexReverse, indexMin, indexMax) : [];
  const fmt = (v: number) => parseFloat(v.toFixed(3)).toString();

  const indexLeft = (
    <>
      <div className="border-t pt-5 space-y-2">
        <div className={sectionLabel}>Index bands</div>
        {[0, 1].map((slot) => (
          <div key={slot} className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded text-[11px] font-bold bg-muted text-foreground w-6 h-6 flex-shrink-0">
              {slot === 0 ? 'A' : 'B'}
            </span>
            <Select
              value={indexBands[slot] ? String(indexBands[slot]) : undefined}
              onValueChange={(v) => assignIndexBand(slot, Number(v))}
            >
              <SelectTrigger className="h-8 text-xs flex-1" aria-label={`Index band ${slot === 0 ? 'A' : 'B'}`}>
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
        <p className="text-[11px] text-muted-foreground font-mono">
          {INDEX_RECIPES.find((r) => r.id === indexRecipe)?.formula} · computed as (A − B) / (A + B)
        </p>
      </div>
      <div className="space-y-2">
        <div className={sectionLabel}>Colour ramp</div>
        <div className="flex items-center gap-2">
          <Select value={indexColormap} onValueChange={setIndexColormap}>
            <SelectTrigger className="h-8 text-xs flex-1" aria-label="Colour ramp"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INDEX_COLORMAPS.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-16 rounded-sm" style={{ background: createGradientCSS(c, indexReverse) }} />
                    {c}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox checked={indexReverse} onCheckedChange={(v) => setIndexReverse(v === true)} /> Reverse
          </label>
        </div>
      </div>
    </>
  );

  const indexRight = (
    <div className="space-y-4">
      <div className={sectionLabel}>Index value range</div>
      <div className="space-y-1">
        <div className="h-5 rounded-sm border" style={{ background: createGradientCSS(indexColormap, indexReverse) }} />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{fmt(indexMin)}</span>
          <span>{fmt((indexMin + indexMax) / 2)}</span>
          <span>{fmt(indexMax)}</span>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Min</span>
          <Input type="number" step={0.05} min={-1} max={1} className="h-8 w-24 text-xs" value={indexMin}
            onChange={(e) => setIndexMin(Number(e.target.value))} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Max</span>
          <Input type="number" step={0.05} min={-1} max={1} className="h-8 w-24 text-xs" value={indexMax}
            onChange={(e) => setIndexMax(Number(e.target.value))} />
        </label>
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={resetIndexRange}>
          Reset to default
        </Button>
      </div>
      {!(indexMax > indexMin) && <p className="text-[11px] text-destructive">Max must be greater than min.</p>}
      <div className="flex flex-wrap gap-1.5">
        {indexRangePresets(indexRecipe).map((p) => (
          <Button key={p.label} type="button" size="sm" variant="secondary" className="h-7 text-xs"
            onClick={() => { setIndexMin(p.min); setIndexMax(p.max); }}>
            {p.label} ({p.min} – {p.max})
          </Button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Index values run from −1 to 1. Values below min take the first colour, above max the last. Pixels where both bands are zero (no data) stay transparent.
        {indexStops.length > 0 && ` ${indexStops.length} colour stops.`}
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl h-[85vh] flex flex-col">
        {view === 'gallery' ? (
          <DialogHeader>
            <DialogTitle>Multi-band visualisations</DialogTitle>
            <DialogDescription>Choose a composite or index to edit.</DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle>Multi-band visualisations</DialogTitle>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto self-start p-0 text-xs text-muted-foreground"
              onClick={() => { setHomeTab(mode); setView('gallery'); }}
            >← Back to visualisations</Button>
          </DialogHeader>
        )}

        {view === 'gallery' ? (
          <ScrollArea className="flex-1 min-h-0 pr-3">
            <CompositeGallery
              bandCount={cogBandCount}
              bandLabels={bandLabels}
              loading={loading}
              activeTab={homeTab}
              onTabChange={setHomeTab}
              onPick={handleGalleryPick}
              onPickIndex={handleGalleryPickIndex}
            />
          </ScrollArea>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading band information…
          </div>
        ) : (
          <TooltipProvider delayDuration={400}>
            <div className="flex flex-col flex-1 min-h-0 gap-3">
              <div className="grid grid-rows-2 sm:grid-rows-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 sm:gap-5 flex-1 min-h-0">
              {/* ── Left pane: recipe and bands ── */}
              <ScrollArea className="min-h-0 pr-3">
                <div className="space-y-5">
                  {multiDataset && (
                    <div className="space-y-2 min-w-0">
                      <div className={sectionLabel}>Dataset</div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7 shrink-0" aria-label="Previous dataset"
                          disabled={scopePos <= 0} onClick={() => changeScope(cogIdx[scopePos - 1])}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Select value={String(scope)} onValueChange={(v) => changeScope(Number(v))}>
                          <SelectTrigger className="h-7 min-w-0 flex-1 text-xs" aria-label="Dataset"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {cogIdx.map((i, pos) => (
                              <SelectItem key={i} value={String(i)} className="text-xs">
                                {datasetLabel(source.data[i], pos + 1)} · {visualisationName(source.data[i], cogBandCount, bandLabels)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7 shrink-0" aria-label="Next dataset"
                          disabled={scopePos >= cogIdx.length - 1} onClick={() => changeScope(cogIdx[scopePos + 1])}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {mode === 'rgb' && <div className={`${multiDataset ? 'border-t pt-5' : ''} space-y-2`}>
                    <div className={sectionLabel}>
                      Composite
                      {sensor && <span className="normal-case tracking-normal font-normal ml-2">· detected {SENSOR_NAMES[sensor]}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      {RGB_RECIPES.map((r) => {
                        const Icon = RECIPE_ICONS[r.id];
                        const bands = resolveRecipeBands(r.id, cogBandCount, bandLabels);
                        const unavailable = r.id !== 'custom' && !bands;
                        const active = mode === 'rgb' && currentRecipe === r.id;
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
                                  onClick={() => askStyleScope(() => applyRecipe(r.id))}
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
                  </div>}

                  {mode === 'index' && <div className={`${multiDataset ? 'border-t pt-5' : ''} space-y-2`}>
                    <div className={sectionLabel}>Spectral indices</div>
                    <div className="flex flex-col gap-1">
                      {INDEX_RECIPES.map((r) => {
                        const Icon = INDEX_ICONS[r.id];
                        const bands = resolveIndexBands(r.id, cogBandCount, bandLabels);
                        const unavailable = r.id !== 'custom-index' && !bands;
                        const active = mode === 'index' && indexRecipe === r.id;
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
                                  onClick={() => applyIndexRecipe(r.id)}
                                >
                                  <span className="flex items-center gap-1.5 min-w-0">
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{r.fullName}</span>
                                  </span>
                                  {bands && <span className="opacity-70 font-normal">{bands.join(' & ')}</span>}
                                </Button>
                                {active && <p className="text-[11px] text-muted-foreground mt-1 px-1">{r.description}</p>}
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
                  </div>}

                  {mode === 'rgb' ? (<>
                  <div className="border-t pt-5 space-y-2">
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
                          onValueChange={(v) => askStyleScope(() => assignBand(i, Number(v)))}
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

                  </>) : indexLeft}
                </div>
              </ScrollArea>

              {/* ── Right pane: stacked channel histograms ── */}
              <ScrollArea className="min-h-0 border-l pl-5 pr-3">
                {mode === 'rgb' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className={sectionLabel}>Contrast stretch (all bands)</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <Select value={sharedMethod ?? 'custom'} onValueChange={chooseStretchMethod}>
                        <SelectTrigger className="h-8 w-auto min-w-[7.5rem] gap-2 text-xs" aria-label="Contrast stretch (all bands)"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STRETCH_METHODS.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                          ))}
                          <SelectItem value="custom" disabled className="text-xs">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      {multiDataset && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox
                            checked={applyAll}
                            disabled={!allChannelsSet}
                            aria-label="Apply to all datasets"
                            onCheckedChange={(v) => {
                              const on = v === true;
                              setApplyAll(on);
                              if (!on) { batchAbortRef.current?.abort(); setBatchProgress(null); setBatchMessage(null); }
                              else void applyToAllDatasets();
                            }}
                          />
                          Apply to all datasets
                        </label>
                      )}
                      {batchProgress && (
                        <span className="flex items-center text-[11px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" /> {batchProgress.done} of {batchProgress.total} datasets
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {!sharedMethod
                        ? 'Ranges differ per band or were set by hand. Pick a method to re-apply it to every band.'
                        : STRETCH_METHODS.find((m) => m.id === sharedMethod)?.description}
                      {multiDataset && applyAll && ' Each composite dataset is stretched using its own bands and pixel values.'}
                    </p>
                    {stretchError && <p className="text-[11px] text-destructive">{stretchError}</p>}
                    {batchMessage && <p className="text-[11px] text-muted-foreground">{batchMessage}</p>}
                  </div>
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
                                active: channelMethods[i] === m.id,
                                onApply: () => applyChannelStretch(i, m.id, hist),
                              })) : undefined}
                              chartHeight={110}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                ) : indexRight}
              </ScrollArea>
              </div>
            </div>
          </TooltipProvider>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {multiDataset ? 'Close' : 'Cancel'}
          </Button>
          {view === 'editor' && multiDataset && (
            <Button variant="outline" onClick={() => handleSave(false)} disabled={!canSave}>
              Apply
            </Button>
          )}
          {view === 'editor' && (
            <Button onClick={() => handleSave(true)} disabled={!canSave}>
              Save
            </Button>
          )}
        </DialogFooter>
        <AlertDialog open={pendingStyle !== null} onOpenChange={(isOpen) => { if (!isOpen) setPendingStyle(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change composite style?</AlertDialogTitle>
              <AlertDialogDescription>Apply this composite or band choice to this dataset, or use it for every dataset? Contrast stretch is controlled separately.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPendingStyle(null)}>Cancel</Button>
              <Button variant="outline" onClick={() => confirmStyleScope('this')}>This dataset</Button>
              <Button onClick={() => confirmStyleScope('all')}>All datasets</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
