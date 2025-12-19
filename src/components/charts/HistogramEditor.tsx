import React from 'react';
import { ChartConfig, ChartTrace, TraceHistogram } from '@/types/chart';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractHexColor } from '@/utils/colorPalettes';

interface HistogramEditorProps {
  config: ChartConfig;
  numericColumns: string[];
  onConfigChange: (config: ChartConfig) => void;
}

export function HistogramEditor({ config, numericColumns, onConfigChange }: HistogramEditorProps) {
  const trace = config.traces?.[0] || { y: '', type: 'histogram', histogram: {} };
  const histogram = trace.histogram || {};
  const markerColor = extractHexColor(trace.marker?.color, '#2563eb');

  const updateTrace = (updates: Partial<ChartTrace>) => {
    const updatedTrace = { ...trace, ...updates };
    onConfigChange({
      ...config,
      traces: [updatedTrace],
    });
  };

  const updateHistogram = (updates: Partial<TraceHistogram>) => {
    updateTrace({
      histogram: { ...histogram, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Data Column */}
        <div>
          <Label className="text-sm font-medium">Data Column</Label>
          <p className="text-xs text-muted-foreground mb-2">
            The numeric column to create histogram from
          </p>
          <Select value={trace.y || ''} onValueChange={(y) => updateTrace({ y, name: y })}>
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {numericColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Number of Bins */}
        <div>
          <Label className="text-sm font-medium">Number of Bins</Label>
          <p className="text-xs text-muted-foreground mb-2">
            0 = Auto, or specify the number of bins
          </p>
          <div className="flex items-center gap-4">
            <Slider
              value={[histogram.nbinsx || 0]}
              onValueChange={([nbinsx]) => updateHistogram({ nbinsx: nbinsx || undefined })}
              min={0}
              max={50}
              step={5}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12">
              {histogram.nbinsx || 'Auto'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Normalization */}
        <div>
          <Label className="text-sm font-medium">Normalization</Label>
          <p className="text-xs text-muted-foreground mb-2">
            How to normalize the histogram values
          </p>
          <Select 
            value={histogram.histnorm || ''} 
            onValueChange={(histnorm) => updateHistogram({ histnorm: histnorm || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (Count)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (Count)</SelectItem>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="probability">Probability</SelectItem>
              <SelectItem value="density">Density</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        <div>
          <Label className="text-sm font-medium">Bar Color</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Color of the histogram bars
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={markerColor}
              onChange={(e) => updateTrace({ marker: { ...trace.marker, color: e.target.value } })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">{markerColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
