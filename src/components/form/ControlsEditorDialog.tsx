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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataSource } from '@/types/config';
import { DataSourceLayout } from '@/types/layer';

interface ControlsEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onSave: (layoutUpdates: Partial<DataSourceLayout>, sourceFieldUpdates: Record<string, any>) => void;
}

const ControlsEditorDialog = ({
  open,
  onOpenChange,
  source,
  onSave,
}: ControlsEditorDialogProps) => {
  const rawControls = source.layout?.layerCard?.controls || source.layout?.infoPanel?.controls;
  const isControlsObject = rawControls && typeof rawControls === 'object' && !Array.isArray(rawControls);
  const controls = isControlsObject ? rawControls : undefined;

  const [toggleable, setToggleable] = useState(!!source.layout?.layerCard?.toggleable);
  const [zoomToCenter, setZoomToCenter] = useState(!!controls?.zoomToCenter);
  const [opacitySlider, setOpacitySlider] = useState(!!controls?.opacitySlider);
  const [blendControls, setBlendControls] = useState(!!controls?.blendControls);
  const [constraintSlider, setConstraintSlider] = useState(!!controls?.constraintSlider);
  const [temporalControls, setTemporalControls] = useState(!!controls?.temporalControls);
  const [downloadEnabled, setDownloadEnabled] = useState(controls?.download !== undefined);
  const [downloadUrl, setDownloadUrl] = useState(typeof controls?.download === 'string' ? controls.download : '');
  const [timeframe, setTimeframe] = useState<string>(source.timeframe || 'None');

  // Reset local state when dialog opens - only depend on `open` to avoid
  // re-initializing state when dispatches update the source mid-save
  useEffect(() => {
    if (open) {
      const raw = source.layout?.layerCard?.controls || source.layout?.infoPanel?.controls;
      const isObj = raw && typeof raw === 'object' && !Array.isArray(raw);
      const ctrl = isObj ? raw : undefined;

      setToggleable(!!source.layout?.layerCard?.toggleable);
      setZoomToCenter(!!ctrl?.zoomToCenter);
      setOpacitySlider(!!ctrl?.opacitySlider);
      setBlendControls(!!ctrl?.blendControls);
      setConstraintSlider(!!ctrl?.constraintSlider);
      setTemporalControls(!!ctrl?.temporalControls);
      setDownloadEnabled(ctrl?.download !== undefined);
      setDownloadUrl(typeof ctrl?.download === 'string' ? ctrl.download : '');
      setTimeframe(source.timeframe || 'None');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = () => {
    const newControls: Record<string, any> = {};
    if (opacitySlider) newControls.opacitySlider = true;
    if (zoomToCenter) newControls.zoomToCenter = true;
    if (blendControls) newControls.blendControls = true;
    if (constraintSlider) newControls.constraintSlider = true;
    if (temporalControls) newControls.temporalControls = true;
    if (downloadEnabled) newControls.download = downloadUrl || '';

    const layoutUpdates: Partial<DataSourceLayout> = {
      layerCard: {
        ...source.layout?.layerCard,
        toggleable,
        controls: Object.keys(newControls).length > 0 ? newControls : undefined,
      },
    };

    const sourceFieldUpdates: Record<string, any> = {
      timeframe: timeframe === 'None' ? undefined : timeframe,
    };

    onSave(layoutUpdates, sourceFieldUpdates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Controls</DialogTitle>
          <DialogDescription>
            Configure layer controls and timeframe settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Switches grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-toggleable" className="text-sm">Toggleable</Label>
              <Switch id="ctrl-toggleable" checked={toggleable} onCheckedChange={setToggleable} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-zoom" className="text-sm">Zoom to Center</Label>
              <Switch id="ctrl-zoom" checked={zoomToCenter} onCheckedChange={setZoomToCenter} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-opacity" className="text-sm">Opacity Slider</Label>
              <Switch id="ctrl-opacity" checked={opacitySlider} onCheckedChange={setOpacitySlider} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-blend" className="text-sm">Blend Controls</Label>
              <Switch id="ctrl-blend" checked={blendControls} onCheckedChange={setBlendControls} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-constraint" className="text-sm">Constraint Slider</Label>
              <Switch id="ctrl-constraint" checked={constraintSlider} onCheckedChange={setConstraintSlider} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-temporal" className="text-sm">Temporal Controls</Label>
              <Switch id="ctrl-temporal" checked={temporalControls} onCheckedChange={setTemporalControls} />
            </div>
          </div>

          {/* Download */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ctrl-download" className="text-sm">Download</Label>
              <Switch id="ctrl-download" checked={downloadEnabled} onCheckedChange={setDownloadEnabled} />
            </div>
            {downloadEnabled && (
              <Input
                placeholder="Download URL (optional)"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
              />
            )}
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <Label className="text-sm">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="months">Months</SelectItem>
                <SelectItem value="years">Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ControlsEditorDialog;
