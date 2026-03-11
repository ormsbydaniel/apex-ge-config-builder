import React, { useState, useEffect, useRef } from 'react';
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
import { DataSourceMeta } from '@/types/layer';

interface GradientEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta?: DataSourceMeta;
  onUpdateMeta: (updates: Partial<DataSourceMeta>) => void;
}

const GradientEditorDialog = ({
  open,
  onOpenChange,
  meta,
  onUpdateMeta,
}: GradientEditorDialogProps) => {
  const [startColor, setStartColor] = useState(meta?.startColor || '#000000');
  const [endColor, setEndColor] = useState(meta?.endColor || '#ffffff');
  const [minValue, setMinValue] = useState(meta?.min?.toString() || '');
  const [maxValue, setMaxValue] = useState(meta?.max?.toString() || '');

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setStartColor(meta?.startColor || '#000000');
      setEndColor(meta?.endColor || '#ffffff');
      setMinValue(meta?.min?.toString() || '');
      setMaxValue(meta?.max?.toString() || '');
    }
    prevOpenRef.current = open;
  }, [open, meta]);

  const hasColormaps = (meta?.colormaps?.length || 0) > 0;

  const handleSave = () => {
    const updates: Partial<DataSourceMeta> = {};

    if (!hasColormaps) {
      if (startColor) updates.startColor = startColor;
      if (endColor) updates.endColor = endColor;
    }

    if (minValue) updates.min = parseFloat(minValue);
    if (maxValue) updates.max = parseFloat(maxValue);

    if (Object.keys(updates).length > 0) {
      onUpdateMeta(updates);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gradient Settings</DialogTitle>
          <DialogDescription>
            Configure gradient colors and value range for this layer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {!hasColormaps ? (
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
          ) : (
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

export default GradientEditorDialog;
