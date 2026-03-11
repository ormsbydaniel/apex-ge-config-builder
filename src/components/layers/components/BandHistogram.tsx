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

/** Chart margins must match Recharts margin prop */
const CHART_MARGIN = { top: 4, right: 8, bottom: 20, left: 8 };

interface DraggableChartProps {
  data: HistogramBin[];
  dataMin: number;
  dataMax: number;
  min: number;
  max: number;
  channelColor: string;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  onStretch?: (min: number, max: number) => void;
}

function DraggableChart({
  data, dataMin, dataMax, min, max, channelColor, onMinChange, onMaxChange, onStretch,
}: DraggableChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  /** Convert a pixel X position (relative to container) to a data value */
  const pxToValue = useCallback(
    (clientX: number): number => {
      const el = containerRef.current;
      if (!el) return min;
      const rect = el.getBoundingClientRect();
      const plotLeft = CHART_MARGIN.left;
      const plotRight = rect.width - CHART_MARGIN.right;
      const plotWidth = plotRight - plotLeft;
      const relX = clientX - rect.left - plotLeft;
      const ratio = Math.max(0, Math.min(1, relX / plotWidth));
      return dataMin + ratio * (dataMax - dataMin);
    },
    [dataMin, dataMax, min],
  );

  /** Convert a data value to a percentage position within the plot area */
  const valueToPct = useCallback(
    (v: number): number => {
      if (dataMax === dataMin) return 0;
      return ((v - dataMin) / (dataMax - dataMin)) * 100;
    },
    [dataMin, dataMax],
  );

  const handlePointerDown = useCallback(
    (which: 'min' | 'max') => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(which);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const val = Math.round(pxToValue(e.clientX) * 100) / 100;
      if (dragging === 'min') {
        const clamped = Math.min(val, max);
        onMinChange(clamped);
      } else {
        const clamped = Math.max(val, min);
        onMaxChange(clamped);
      }
    },
    [dragging, pxToValue, min, max, onMinChange, onMaxChange],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const minPct = valueToPct(min);
  const maxPct = valueToPct(max);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 relative select-none"
      style={{ minHeight: 200 }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap={0}>
          <XAxis
            dataKey="x"
            type="number"
            domain={[dataMin, dataMax]}
            tickFormatter={formatTickValue}
            tick={{ fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis hide />
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
          <ReferenceLine
            x={min}
            stroke={channelColor}
            strokeDasharray="4 2"
            strokeWidth={1.5}
          />
          <ReferenceLine
            x={max}
            stroke={channelColor}
            strokeDasharray="4 2"
            strokeWidth={1.5}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Drag handle overlay — positioned over the plot area */}
      <div
        className="absolute"
        style={{
          left: CHART_MARGIN.left,
          right: CHART_MARGIN.right,
          top: CHART_MARGIN.top,
          bottom: CHART_MARGIN.bottom,
        }}
      >
        {(['min', 'max'] as const).map((which) => {
          const pct = which === 'min' ? minPct : maxPct;
          return (
            <div
              key={which}
              onPointerDown={handlePointerDown(which)}
              className="absolute top-0 h-full"
              style={{
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                width: 14,
                cursor: 'ew-resize',
                zIndex: 10,
              }}
            >
              {/* Visual grip tab */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b"
                style={{
                  width: 10,
                  height: 22,
                  backgroundColor: channelColor,
                  opacity: dragging === which ? 1 : 0.75,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  transition: dragging ? 'none' : 'opacity 0.15s',
                }}
              >
                <div className="flex flex-col items-center justify-center h-full gap-[2px] pt-1">
                  <div className="w-[5px] h-[1px] bg-white/80 rounded" />
                  <div className="w-[5px] h-[1px] bg-white/80 rounded" />
                  <div className="w-[5px] h-[1px] bg-white/80 rounded" />
                </div>
              </div>
              {/* Label */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap pointer-events-none"
                style={{ color: channelColor }}
              >
                {which === 'min' ? 'Min' : 'Max'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
