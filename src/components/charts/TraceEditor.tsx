import React from 'react';
import { ChartTrace } from '@/types/chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Trash2, Undo2, ChevronLeft, ChevronRight } from 'lucide-react';
import { extractHexColor, extractOpacity, hexToRgba } from '@/utils/colorPalettes';

interface TraceEditorProps {
  trace: ChartTrace;
  traceIndex: number;
  columns: string[];
  onUpdate: (trace: ChartTrace) => void;
  onRemove: () => void;
}

export function TraceEditor({ trace, traceIndex, columns, onUpdate, onRemove }: TraceEditorProps) {
  const hasLines = trace.mode?.includes('lines') ?? true;
  const hasMarkers = trace.mode?.includes('markers') ?? false;
  const hasFill = trace.fill && trace.fill !== 'none';

  const lineColor = extractHexColor(trace.line?.color, '#2563eb');
  const markerColor = extractHexColor(trace.marker?.color, '#2563eb');
  const fillColor = extractHexColor(trace.fillcolor, '#2563eb');
  const fillOpacity = extractOpacity(trace.fillcolor, 0.3);

  const updateMode = (lines: boolean, markers: boolean) => {
    // Prevent disabling both
    if (!lines && !markers) return;
    
    let mode: 'lines' | 'markers' | 'lines+markers';
    if (lines && markers) mode = 'lines+markers';
    else if (lines) mode = 'lines';
    else mode = 'markers';
    
    onUpdate({ ...trace, mode });
  };

  const updateLine = (updates: Partial<ChartTrace['line']>) => {
    onUpdate({ ...trace, line: { ...trace.line, ...updates } });
  };

  const updateMarker = (updates: Partial<ChartTrace['marker']>) => {
    onUpdate({ ...trace, marker: { ...trace.marker, ...updates } });
  };

  const updateFill = (fill: ChartTrace['fill'], color?: string, opacity?: number) => {
    const fillcolor = color && opacity !== undefined 
      ? hexToRgba(color, opacity) 
      : trace.fillcolor;
    onUpdate({ ...trace, fill, fillcolor });
  };

  const copyLineToMarker = () => updateMarker({ color: lineColor });
  const copyMarkerToLine = () => updateLine({ color: markerColor });
  const copyLineToFill = () => updateFill(trace.fill, lineColor, fillOpacity);
  const copyFillToLine = () => updateLine({ color: fillColor });
  const copyMarkerToFill = () => updateFill(trace.fill, markerColor, fillOpacity);
  const copyFillToMarker = () => updateMarker({ color: fillColor });

  const resetLine = () => updateLine({ color: '#2563eb', width: 2, dash: 'solid', shape: 'linear' });
  const resetMarker = () => updateMarker({ color: '#2563eb', size: 6, symbol: 'circle' });
  const resetFill = () => updateFill('tozeroy', '#2563eb', 0.3);

  const isLineModified = lineColor !== '#2563eb' || (trace.line?.width ?? 2) !== 2 || 
    (trace.line?.dash ?? 'solid') !== 'solid' || (trace.line?.shape ?? 'linear') !== 'linear';
  const isMarkerModified = markerColor !== '#2563eb' || (trace.marker?.size ?? 6) !== 6 || 
    (trace.marker?.symbol ?? 'circle') !== 'circle';
  const isFillModified = fillColor !== '#2563eb' || fillOpacity !== 0.3;

  return (
    <div className="p-4 border-l">
      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column: Y Column Selection */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="font-medium">{trace.name || trace.y || `Trace ${traceIndex + 1}`}</div>
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive h-8 px-2">
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>

          {/* Y Column and Legend */}
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
              <div>
                <Label className="text-xs">Y Column</Label>
                <Select value={trace.y} onValueChange={(y) => onUpdate({ ...trace, y })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.filter(col => col !== '').map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 pb-1">
                <Label className="text-xs">Legend</Label>
                <Switch
                  checked={trace.showlegend !== false}
                  onCheckedChange={(showlegend) => onUpdate({ ...trace, showlegend })}
                  className="scale-75"
                />
              </div>

              <div>
                <Label className="text-xs">Legend Label</Label>
                <Input
                  value={trace.name || ''}
                  onChange={(e) => onUpdate({ ...trace, name: e.target.value })}
                  placeholder={trace.y || ''}
                  className="h-8 text-xs"
                  disabled={trace.showlegend === false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Style Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Style</Label>
          
          {/* Lines, Markers, Fill checkboxes in a row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={hasLines}
                onCheckedChange={(checked) => updateMode(!!checked, hasMarkers)}
              />
              <Label className="text-xs">Lines</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={hasMarkers}
                onCheckedChange={(checked) => updateMode(hasLines, !!checked)}
              />
              <Label className="text-xs">Markers</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={hasFill}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFill('tozeroy', lineColor, 0.3);
                  } else {
                    onUpdate({ ...trace, fill: 'none', fillcolor: undefined });
                  }
                }}
              />
              <Label className="text-xs">Fill</Label>
            </div>
          </div>

          {/* Color Picker */}
          {hasLines && (
            <div>
              <Input
                type="color"
                value={lineColor}
                onChange={(e) => {
                  updateLine({ color: e.target.value });
                  // Sync marker and fill colors
                  if (hasMarkers) updateMarker({ color: e.target.value });
                  if (hasFill) updateFill(trace.fill, e.target.value, fillOpacity);
                }}
                className="w-full h-10 p-1 cursor-pointer"
              />
            </div>
          )}

          {/* Width Slider */}
          {hasLines && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Width</Label>
                <span className="text-xs text-muted-foreground">{trace.line?.width ?? 2}px</span>
              </div>
              <Slider
                value={[trace.line?.width ?? 2]}
                onValueChange={([width]) => updateLine({ width })}
                min={0}
                max={5}
                step={1}
                className="mt-1"
              />
            </div>
          )}

          {/* Dash Style */}
          {hasLines && (
            <Select value={trace.line?.dash || 'solid'} onValueChange={(dash) => updateLine({ dash })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dash">Dash</SelectItem>
                <SelectItem value="dot">Dot</SelectItem>
                <SelectItem value="dashdot">Dash-Dot</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Line Shape */}
          {hasLines && (
            <Select value={trace.line?.shape || 'linear'} onValueChange={(shape) => updateLine({ shape })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="spline">Spline</SelectItem>
                <SelectItem value="hv">Step (HV)</SelectItem>
                <SelectItem value="vh">Step (VH)</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Marker-specific options when lines are off */}
          {hasMarkers && !hasLines && (
            <>
              <div>
                <Input
                  type="color"
                  value={markerColor}
                  onChange={(e) => updateMarker({ color: e.target.value })}
                  className="w-full h-10 p-1 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Size</Label>
                  <span className="text-xs text-muted-foreground">{trace.marker?.size ?? 6}px</span>
                </div>
                <Slider
                  value={[trace.marker?.size ?? 6]}
                  onValueChange={([size]) => updateMarker({ size })}
                  min={2}
                  max={12}
                  step={1}
                  className="mt-1"
                />
              </div>
              <Select value={trace.marker?.symbol || 'circle'} onValueChange={(symbol) => updateMarker({ symbol })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="cross">Cross</SelectItem>
                  <SelectItem value="x">X</SelectItem>
                  <SelectItem value="triangle-up">Triangle</SelectItem>
                  <SelectItem value="star">Star</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {/* Fill opacity when fill is enabled */}
          {hasFill && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Fill Opacity</Label>
                <span className="text-xs text-muted-foreground">{Math.round(fillOpacity * 100)}%</span>
              </div>
              <Slider
                value={[Math.round(fillOpacity * 100)]}
                onValueChange={([opacity]) => updateFill(trace.fill, fillColor, opacity / 100)}
                min={5}
                max={100}
                step={5}
                className="mt-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
