import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataSourceMeta, DataSourceLayout } from '@/types/layer';

interface LegendEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legend?: { type: 'swatch' | 'gradient' | 'image'; url?: string };
  meta?: DataSourceMeta;
  onUpdateLegend: (legend: { type: 'swatch' | 'gradient' | 'image'; url?: string }) => void;
  onUpdateMeta: (updates: Partial<DataSourceMeta>) => void;
}

const LegendEditorDialog = ({
  open,
  onOpenChange,
  legend,
  meta,
  onUpdateLegend,
  onUpdateMeta,
}: LegendEditorDialogProps) => {
  const [legendType, setLegendType] = useState<'auto' | 'image' | 'gradient'>(
    legend?.type === 'gradient' ? 'gradient' : legend?.type === 'image' ? 'image' : 'auto'
  );
  const [legendUrl, setLegendUrl] = useState(legend?.url || '');
  const [startColor, setStartColor] = useState(meta?.startColor || '#000000');
  const [endColor, setEndColor] = useState(meta?.endColor || '#ffffff');
  const [minValue, setMinValue] = useState(meta?.min?.toString() || '');
  const [maxValue, setMaxValue] = useState(meta?.max?.toString() || '');

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLegendType(legend?.type || 'swatch');
      setLegendUrl(legend?.url || '');
      setStartColor(meta?.startColor || '#000000');
      setEndColor(meta?.endColor || '#ffffff');
      setMinValue(meta?.min?.toString() || '');
      setMaxValue(meta?.max?.toString() || '');
    }
  }, [open, legend, meta]);

  const hasColormaps = (meta?.colormaps?.length || 0) > 0;

  const handleSave = () => {
    const updatedLegend: { type: 'swatch' | 'gradient' | 'image'; url?: string } = {
      type: legendType,
    };
    if (legendType === 'image' && legendUrl) {
      updatedLegend.url = legendUrl;
    }
    onUpdateLegend(updatedLegend);

    if (legendType === 'gradient' && !hasColormaps) {
      const metaUpdates: Partial<DataSourceMeta> = {};
      if (startColor) metaUpdates.startColor = startColor;
      if (endColor) metaUpdates.endColor = endColor;
      if (minValue) metaUpdates.min = parseFloat(minValue);
      if (maxValue) metaUpdates.max = parseFloat(maxValue);
      if (Object.keys(metaUpdates).length > 0) {
        onUpdateMeta(metaUpdates);
      }
    }

    if (legendType === 'gradient' && hasColormaps) {
      const metaUpdates: Partial<DataSourceMeta> = {};
      if (minValue) metaUpdates.min = parseFloat(minValue);
      if (maxValue) metaUpdates.max = parseFloat(maxValue);
      if (Object.keys(metaUpdates).length > 0) {
        onUpdateMeta(metaUpdates);
      }
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legend Settings</DialogTitle>
          <DialogDescription>
            Configure the legend type and appearance for this layer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Legend Type */}
          <div className="space-y-2">
            <Label>Legend Type</Label>
            <Select value={legendType} onValueChange={(v) => setLegendType(v as 'swatch' | 'gradient' | 'image')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swatch">Swatch</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image URL */}
          {legendType === 'image' && (
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={legendUrl}
                onChange={(e) => setLegendUrl(e.target.value)}
                placeholder="https://example.com/legend.png"
              />
            </div>
          )}

          {/* Gradient fields */}
          {legendType === 'gradient' && (
            <div className="space-y-3">
              {!hasColormaps && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={startColor}
                        onChange={(e) => setStartColor(e.target.value)}
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={startColor}
                        onChange={(e) => setStartColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>End Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={endColor}
                        onChange={(e) => setEndColor(e.target.value)}
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={endColor}
                        onChange={(e) => setEndColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {hasColormaps && (
                <p className="text-xs text-muted-foreground italic">
                  Colors are derived from colormaps. Edit colormaps to change gradient colors.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min Value</Label>
                  <Input
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Value</Label>
                  <Input
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>

              {!hasColormaps && startColor && endColor && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Preview</Label>
                  <div
                    className="h-5 rounded border border-border"
                    style={{
                      background: `linear-gradient(to right, ${startColor}, ${endColor})`
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Swatch info */}
          {legendType === 'swatch' && (
            <p className="text-sm text-muted-foreground italic">
              Swatch legends use the defined categories. Edit categories to update the legend.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegendEditorDialog;
