import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';

interface HistogramBin {
  x: number;
  count: number;
}

interface BandHistogramProps {
  data: HistogramBin[] | null;
  loading: boolean;
  error?: string | null;
  channelColor: string;
  channelLabel: string;
  bandLabel: string;
  dataMin: number;
  dataMax: number;
  min: number;
  max: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  onStretch?: (min: number, max: number) => void;
}

function formatTickValue(v: number): string {
  if (Math.abs(v) >= 10000) return v.toExponential(1);
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(1);
}

/** Compute the value at a given percentile (0-100) from histogram bins. */
function percentileFromHistogram(bins: HistogramBin[], percentile: number): number {
  const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
  if (totalCount === 0) return bins[0]?.x ?? 0;
  const target = totalCount * (percentile / 100);
  let cumulative = 0;
  for (const bin of bins) {
    cumulative += bin.count;
    if (cumulative >= target) return bin.x;
  }
  return bins[bins.length - 1].x;
}

export function BandHistogram({
  data,
  loading,
  error,
  channelColor,
  channelLabel,
  bandLabel,
  dataMin,
  dataMax,
  min,
  max,
  onMinChange,
  onMaxChange,
  onStretch,
}: BandHistogramProps) {
  const applyStretch = useCallback(
    (lo: number, hi: number) => {
      if (!data || data.length === 0) return;
      const newMin = percentileFromHistogram(data, lo);
      const newMax = percentileFromHistogram(data, hi);
      if (onStretch) {
        onStretch(newMin, newMax);
      } else {
        onMinChange(newMin);
        onMaxChange(newMax);
      }
    },
    [data, onMinChange, onMaxChange, onStretch],
  );
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading histogram…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center rounded text-[11px] font-bold text-white w-6 h-6 flex-shrink-0"
          style={{ backgroundColor: channelColor }}
        >
          {channelLabel}
        </span>
        <span className="text-sm font-medium">{bandLabel}</span>
      </div>

      {/* Chart with draggable min/max lines */}
      <DraggableChart
        data={data}
        dataMin={dataMin}
        dataMax={dataMax}
        min={min}
        max={max}
        channelColor={channelColor}
        onMinChange={onMinChange}
        onMaxChange={onMaxChange}
        onStretch={onStretch}
      />

      {/* Min/Max inputs + auto-stretch */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Min</Label>
          <Input
            type="number"
            className="h-7 w-24 text-xs"
            value={min}
            onChange={(e) => onMinChange(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Max</Label>
          <Input
            type="number"
            className="h-7 w-24 text-xs"
            value={max}
            onChange={(e) => onMaxChange(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={() => applyStretch(2, 98)}
          >
            <Wand2 className="h-3 w-3 mr-1" />
            2–98%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={() => applyStretch(1, 99)}
          >
            1–99%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={() => applyStretch(0, 100)}
          >
            Full
          </Button>
        </div>
      </div>

      {/* Data range helper */}
      <p className="text-[10px] text-muted-foreground">
        Data range: {formatTickValue(dataMin)} – {formatTickValue(dataMax)}
      </p>
    </div>
  );
}
