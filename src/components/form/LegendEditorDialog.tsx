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

interface LegendEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legend?: { type: 'swatch' | 'gradient' | 'image'; url?: string };
  onUpdateLegend: (legend: { type: 'swatch' | 'gradient' | 'image'; url?: string } | null) => void;
  units?: string;
  onUpdateUnits?: (units: string) => void;
}

const LegendEditorDialog = ({
  open,
  onOpenChange,
  legend,
  onUpdateLegend,
  units,
  onUpdateUnits,
}: LegendEditorDialogProps) => {
  const [legendType, setLegendType] = useState<'none' | 'auto' | 'image'>(
    !legend ? 'none' : legend.type === 'image' ? 'image' : 'auto'
  );
  const [legendUrl, setLegendUrl] = useState(legend?.url || '');
  const [unitsValue, setUnitsValue] = useState(units || '');
  const [isValidating, setIsValidating] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLegendType(!legend ? 'none' : legend.type === 'image' ? 'image' : 'auto');
      setLegendUrl(legend?.url || '');
      setUnitsValue(units || '');
      setUrlError(null);
    }
    prevOpenRef.current = open;
  }, [open, legend]);

  const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleSave = async () => {
    if (legendType === 'none') {
      onUpdateLegend(null);
      onUpdateUnits?.(unitsValue);
      onOpenChange(false);
      return;
    }

    if (legendType === 'image' && legendUrl.trim()) {
      setIsValidating(true);
      setUrlError(null);
      const isValid = await validateImageUrl(legendUrl.trim());
      setIsValidating(false);
      if (!isValid) {
        setUrlError('No image found at this URL. Please check the URL and try again.');
        return;
      }
    }

    const resolvedType: 'swatch' | 'gradient' | 'image' =
      legendType === 'auto' ? 'swatch' : legendType;

    const updatedLegend: { type: 'swatch' | 'gradient' | 'image'; url?: string } = {
      type: resolvedType,
    };
    if (resolvedType === 'image' && legendUrl) {
      updatedLegend.url = legendUrl;
    }
    onUpdateLegend(updatedLegend);
    onUpdateUnits?.(unitsValue);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legend and Units</DialogTitle>
          <DialogDescription>
            Configure the legend and units for this layer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Legend Type */}
          <div className="space-y-2">
            <Label>Legend Type</Label>
            <Select value={legendType} onValueChange={(v) => setLegendType(v as 'none' | 'auto' | 'image')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
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
                onChange={(e) => { setLegendUrl(e.target.value); setUrlError(null); }}
                placeholder="https://example.com/legend.png"
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
          )}

          {/* Auto info */}
          {legendType === 'auto' && (
            <p className="text-sm text-muted-foreground italic">
              Legend type will be determined automatically based on layer configuration (e.g. categories → swatch, gradient → gradient).
            </p>
          )}

          {legendType === 'none' && (
            <p className="text-sm text-muted-foreground italic">
              No legend will be displayed for this layer.
            </p>
          )}

          {/* Units */}
          <div className="space-y-2">
            <Label>Units</Label>
            <Input
              value={unitsValue}
              onChange={(e) => setUnitsValue(e.target.value)}
              placeholder="e.g. kg/m², °C, mm/day"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={(legendType === 'image' && !legendUrl.trim()) || isValidating}>
            {isValidating ? 'Validating...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegendEditorDialog;
