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
    <div className="space-y-4 p-4 border-l">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-bold text-sm">Styling settings for "{trace.name || trace.y || `Trace ${traceIndex + 1}`}" data</div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive h-8 px-2">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Y Column and Legend */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
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

        <div className="flex items-center gap-1 pt-4">
          <Switch
            checked={trace.showlegend !== false}
            onCheckedChange={(showlegend) => onUpdate({ ...trace, showlegend })}
            className="scale-75"
          />
          <span className="text-xs text-muted-foreground">Legend</span>
        </div>

        {trace.showlegend !== false && (
          <div>
            <Label className="text-xs">Label</Label>
            <Input
              value={trace.name || ''}
              onChange={(e) => onUpdate({ ...trace, name: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      {/* Style Section - Three Columns */}
      <TooltipProvider>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2">
          {/* Lines Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={hasLines}
                  onCheckedChange={(checked) => updateMode(!!checked, hasMarkers)}
                />
                <Label className="text-xs font-medium">Lines</Label>
              </div>
              {hasLines && isLineModified && (
                <Button variant="ghost" size="sm" onClick={resetLine} className="h-6 w-6 p-0">
                  <Undo2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {hasLines && (
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={lineColor}
                    onChange={(e) => updateLine({ color: e.target.value })}
                    className="w-8 h-8 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">{lineColor}</span>
                </div>
                
                <div>
                  <Label className="text-xs">Width</Label>
                  <Slider
                    value={[trace.line?.width ?? 2]}
                    onValueChange={([width]) => updateLine({ width })}
                    min={0}
                    max={5}
                    step={1}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Dash</Label>
                  <Select value={trace.line?.dash || 'solid'} onValueChange={(dash) => updateLine({ dash })}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dash">Dash</SelectItem>
                      <SelectItem value="dot">Dot</SelectItem>
                      <SelectItem value="dashdot">Dash-Dot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Shape</Label>
                  <Select value={trace.line?.shape || 'linear'} onValueChange={(shape) => updateLine({ shape })}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="spline">Spline</SelectItem>
                      <SelectItem value="hv">Step (HV)</SelectItem>
                      <SelectItem value="vh">Step (VH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Arrow gutters Lines ↔ Markers */}
          <div className="flex flex-col items-center justify-center gap-1 pt-6">
            {hasLines && hasMarkers && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={copyLineToMarker} className="h-6 w-6 p-0">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy color</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={copyMarkerToLine} className="h-6 w-6 p-0">
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy color</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Markers Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={hasMarkers}
                  onCheckedChange={(checked) => updateMode(hasLines, !!checked)}
                />
                <Label className="text-xs font-medium">Markers</Label>
              </div>
              {hasMarkers && isMarkerModified && (
                <Button variant="ghost" size="sm" onClick={resetMarker} className="h-6 w-6 p-0">
                  <Undo2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {hasMarkers && (
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={markerColor}
                    onChange={(e) => updateMarker({ color: e.target.value })}
                    className="w-8 h-8 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">{markerColor}</span>
                </div>
                
                <div>
                  <Label className="text-xs">Size</Label>
                  <Slider
                    value={[trace.marker?.size ?? 6]}
                    onValueChange={([size]) => updateMarker({ size })}
                    min={2}
                    max={12}
                    step={1}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Symbol</Label>
                  <Select value={trace.marker?.symbol || 'circle'} onValueChange={(symbol) => updateMarker({ symbol })}>
                    <SelectTrigger className="h-7 text-xs">
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
                </div>
              </div>
            )}
          </div>

          {/* Arrow gutters Markers ↔ Fill */}
          <div className="flex flex-col items-center justify-center gap-1 pt-6">
            {hasMarkers && hasFill && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={copyMarkerToFill} className="h-6 w-6 p-0">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy color</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={copyFillToMarker} className="h-6 w-6 p-0">
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy color</TooltipContent>
                </Tooltip>
              </>
            )}
            {hasLines && !hasMarkers && hasFill && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={copyLineToFill} className="h-6 w-6 p-0">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy color</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" onClick={copyFillToLine} className="h-6 w-6 p-0">
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy color</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Fill Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
                <Label className="text-xs font-medium">Fill</Label>
              </div>
              {hasFill && isFillModified && (
                <Button variant="ghost" size="sm" onClick={resetFill} className="h-6 w-6 p-0">
                  <Undo2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {hasFill && (
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={fillColor}
                    onChange={(e) => updateFill(trace.fill, e.target.value, fillOpacity)}
                    className="w-8 h-8 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">{fillColor}</span>
                </div>
                
                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={[Math.round(fillOpacity * 100)]}
                    onValueChange={([opacity]) => updateFill(trace.fill, fillColor, opacity / 100)}
                    min={5}
                    max={100}
                    step={5}
                    className="mt-1"
                  />
                  <span className="text-xs text-muted-foreground">{Math.round(fillOpacity * 100)}%</span>
                </div>

                <div>
                  <Label className="text-xs">Fill To</Label>
                  <Select 
                    value={trace.fill || 'tozeroy'} 
                    onValueChange={(fill: 'tozeroy' | 'tonexty') => updateFill(fill, fillColor, fillOpacity)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tozeroy">Zero Y</SelectItem>
                      <SelectItem value="tonexty">Next Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
