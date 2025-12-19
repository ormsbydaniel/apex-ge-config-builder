import React from 'react';
import { ChartConfig, ChartPie } from '@/types/chart';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PieEditorProps {
  config: ChartConfig;
  columns: string[];
  numericColumns: string[];
  onConfigChange: (config: ChartConfig) => void;
}

export function PieEditor({ config, columns, numericColumns, onConfigChange }: PieEditorProps) {
  const pie = config.pie || { labels: '', values: '', hole: 0, textinfo: 'percent' };

  const updatePie = (updates: Partial<ChartPie>) => {
    onConfigChange({
      ...config,
      pie: { ...pie, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Labels Column */}
        <div>
          <Label className="text-sm font-medium">Labels Column</Label>
          <p className="text-xs text-muted-foreground mb-2">
            The column containing category names
          </p>
          <Select value={pie.labels || ''} onValueChange={(labels) => updatePie({ labels })}>
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Values Column */}
        <div>
          <Label className="text-sm font-medium">Values Column</Label>
          <p className="text-xs text-muted-foreground mb-2">
            The column containing numeric values
          </p>
          <Select value={pie.values || ''} onValueChange={(values) => updatePie({ values })}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Donut Hole */}
        <div>
          <Label className="text-sm font-medium">Donut Hole</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Size of the center hole (0 = pie, higher = donut)
          </p>
          <div className="flex items-center gap-4">
            <Slider
              value={[(pie.hole || 0) * 100]}
              onValueChange={([hole]) => updatePie({ hole: hole / 100 })}
              min={0}
              max={70}
              step={5}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12">
              {Math.round((pie.hole || 0) * 100)}%
            </span>
          </div>
        </div>

        {/* Text Display */}
        <div>
          <Label className="text-sm font-medium">Text Display</Label>
          <p className="text-xs text-muted-foreground mb-2">
            What information to show on slices
          </p>
          <Select value={pie.textinfo || 'percent'} onValueChange={(textinfo) => updatePie({ textinfo })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="label">Label Only</SelectItem>
              <SelectItem value="percent">Percent Only</SelectItem>
              <SelectItem value="value">Value Only</SelectItem>
              <SelectItem value="label+percent">Label + Percent</SelectItem>
              <SelectItem value="label+value">Label + Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
