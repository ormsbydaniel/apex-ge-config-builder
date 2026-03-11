import React, { useCallback, useMemo } from 'react';
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
}: BandHistogramProps) {
  const applyStretch = useCallback(
    (lo: number, hi: number) => {
      if (!data || data.length === 0) return;
      onMinChange(percentileFromHistogram(data, lo));
      onMaxChange(percentileFromHistogram(data, hi));
    },
    [data, onMinChange, onMaxChange],
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

      {/* Chart */}
      <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 20, left: 8 }} barCategoryGap={0}>
            <XAxis
              dataKey="x"
              type="number"
              domain={[dataMin, dataMax]}
              tickFormatter={formatTickValue}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              hide
            />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'Pixels']}
              labelFormatter={(label: number) => `Value: ${formatTickValue(label)}`}
              contentStyle={{
                fontSize: 11,
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Bar dataKey="count" isAnimationActive={false}>
              {data.map((entry, index) => {
                const inRange = entry.x >= min && entry.x <= max;
                return (
                  <Cell
                    key={index}
                    fill={inRange ? channelColor : '#9ca3af'}
                    fillOpacity={inRange ? 0.85 : 0.5}
                  />
                );
              })}
            </Bar>
            {/* Min/Max reference lines */}
            <ReferenceLine
              x={min}
              stroke={channelColor}
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{ value: 'Min', position: 'top', fontSize: 9, fill: channelColor }}
            />
            <ReferenceLine
              x={max}
              stroke={channelColor}
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{ value: 'Max', position: 'top', fontSize: 9, fill: channelColor }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Min/Max inputs */}
      <div className="flex items-center gap-4">
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
      </div>

      {/* Data range helper */}
      <p className="text-[10px] text-muted-foreground">
        Data range: {formatTickValue(dataMin)} – {formatTickValue(dataMax)}
      </p>
    </div>
  );
}
