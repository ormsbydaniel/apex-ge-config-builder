import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TimeframeType } from '@/types/config';

interface UnifiedControlsSectionProps {
  opacitySlider: boolean;
  zoomToCenter: boolean;
  zoomToCenterExtent?: [number, number, number, number];
  download: string;
  temporalControls: boolean;
  constraintSlider: boolean;
  blendControls: boolean;
  timeframe: TimeframeType;
  onUpdate: (field: string, value: any) => void;
}

const parseExtentText = (text: string): [number, number, number, number] | null => {
  const parts = text.split(',').map((p) => p.trim());
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => parseFloat(p));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return nums as [number, number, number, number];
};

const UnifiedControlsSection = ({
  opacitySlider,
  zoomToCenter,
  zoomToCenterExtent,
  download,
  temporalControls,
  constraintSlider,
  blendControls,
  timeframe,
  onUpdate
}: UnifiedControlsSectionProps) => {
  const [zoomToCenterMode, setZoomToCenterMode] = useState<'bounds' | 'custom'>(
    zoomToCenterExtent ? 'custom' : 'bounds'
  );
  const [zoomToCenterExtentText, setZoomToCenterExtentText] = useState(
    zoomToCenterExtent ? zoomToCenterExtent.join(', ') : ''
  );

  // Sync from incoming prop when it changes (e.g. when loaded into form)
  useEffect(() => {
    if (zoomToCenterExtent) {
      setZoomToCenterMode('custom');
      setZoomToCenterExtentText(zoomToCenterExtent.join(', '));
    }
  }, [zoomToCenterExtent]);

  const handleModeChange = (mode: 'bounds' | 'custom') => {
    setZoomToCenterMode(mode);
    if (mode === 'bounds') {
      onUpdate('zoomToCenterExtent', undefined);
    } else {
      const parsed = parseExtentText(zoomToCenterExtentText);
      onUpdate('zoomToCenterExtent', parsed ?? undefined);
    }
  };

  const handleExtentTextChange = (text: string) => {
    setZoomToCenterExtentText(text);
    const parsed = parseExtentText(text);
    onUpdate('zoomToCenterExtent', parsed ?? undefined);
  };

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    onUpdate('timeframe', newTimeframe);
    if (newTimeframe === 'None') {
      onUpdate('defaultTimestamp', undefined);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Layer Card Controls</h4>
      
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center justify-between space-x-2 min-w-[140px]">
          <Label htmlFor="zoomToCenter" className="min-w-[90px]">Zoom to layer:</Label>
          <Switch
            id="zoomToCenter"
            checked={zoomToCenter}
            onCheckedChange={(value) => onUpdate('zoomToCenter', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[140px]">
          <Label htmlFor="download" className="min-w-[65px]">Download:</Label>
          <Switch
            id="download"
            checked={download !== undefined}
            onCheckedChange={(value) => {
              if (value) {
                onUpdate('download', '');
              } else {
                onUpdate('download', undefined);
              }
            }}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[140px]">
          <Label htmlFor="opacitySlider" className="min-w-[90px]">Opacity Slider:</Label>
          <Switch
            id="opacitySlider"
            checked={opacitySlider}
            onCheckedChange={(value) => onUpdate('opacitySlider', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[160px]">
          <Label htmlFor="blendControls" className="min-w-[110px]">Blend Controls:</Label>
          <Switch
            id="blendControls"
            checked={blendControls}
            onCheckedChange={(value) => onUpdate('blendControls', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[160px]">
          <Label htmlFor="constraintSlider" className="min-w-[110px]">Constraint Slider:</Label>
          <Switch
            id="constraintSlider"
            checked={constraintSlider}
            onCheckedChange={(value) => onUpdate('constraintSlider', value)}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2 min-w-[160px]">
          <Label htmlFor="temporalControls" className="min-w-[110px]">Temporal Control:</Label>
          <Switch
            id="temporalControls"
            checked={temporalControls}
            onCheckedChange={(value) => onUpdate('temporalControls', value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 min-w-[200px]">
          <Label htmlFor="timeframe" className="whitespace-nowrap">Time picker:</Label>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time dimension" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Time">Time</SelectItem>
              <SelectItem value="Days">Days</SelectItem>
              <SelectItem value="Months">Months</SelectItem>
              <SelectItem value="Years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {zoomToCenter && (
        <div className="ml-2 space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground min-w-[90px]">Zoom target:</Label>
            <Button
              type="button"
              size="sm"
              variant={zoomToCenterMode === 'bounds' ? 'default' : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => handleModeChange('bounds')}
            >
              Layer bounds
            </Button>
            <Button
              type="button"
              size="sm"
              variant={zoomToCenterMode === 'custom' ? 'default' : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => handleModeChange('custom')}
            >
              Custom extent
            </Button>
            {zoomToCenterMode === 'custom' && (
              <Input
                className="h-8 text-sm max-w-[280px]"
                placeholder="xmin, ymin, xmax, ymax"
                value={zoomToCenterExtentText}
                onChange={(e) => handleExtentTextChange(e.target.value)}
              />
            )}
          </div>
        </div>
      )}
      
      {download !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="downloadUrl">Download URL *</Label>
          <Input
            id="downloadUrl"
            value={download || ''}
            onChange={(e) => onUpdate('download', e.target.value)}
            placeholder="https://example.com/download-file.csv"
            required
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedControlsSection;
