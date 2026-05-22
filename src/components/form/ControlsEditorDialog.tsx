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
import { Checkbox } from '@/components/ui/checkbox';
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

const parseExtentText = (text: string): [number, number, number, number] | null => {
  const parts = text.split(',').map((p) => p.trim());
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => parseFloat(p));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return nums as [number, number, number, number];
};

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
  const [zoomToCenter, setZoomToCenter] = useState(!!(controls as any)?.zoomToCenter);
  const [zoomToCenterMode, setZoomToCenterMode] = useState<'bounds' | 'custom'>('bounds');
  const [zoomToCenterExtentText, setZoomToCenterExtentText] = useState('');
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
      const z = (ctrl as any)?.zoomToCenter;

      setToggleable(!!source.layout?.layerCard?.toggleable);
      setZoomToCenter(!!z);
      if (z && typeof z === 'object' && Array.isArray(z.extent)) {
        setZoomToCenterMode('custom');
        setZoomToCenterExtentText(z.extent.join(', '));
      } else {
        setZoomToCenterMode('bounds');
        setZoomToCenterExtentText('');
      }
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
    if (zoomToCenter) {
      if (zoomToCenterMode === 'custom') {
        const parsed = parseExtentText(zoomToCenterExtentText);
        newControls.zoomToCenter = parsed ? { extent: parsed } : true;
      } else {
        newControls.zoomToCenter = true;
      }
    }
    if (blendControls) newControls.blendControls = true;
    if (constraintSlider) newControls.constraintSlider = true;
    if (temporalControls) newControls.temporalControls = true;
    if (downloadEnabled) newControls.download = downloadUrl || '';

    const controlsValue = Object.keys(newControls).length > 0 ? newControls : undefined;
    const isInfoPanel = source.layout?.contentLocation === 'infoPanel';

    const layoutUpdates: Partial<DataSourceLayout> = {
      layerCard: {
        ...source.layout?.layerCard,
        toggleable,
        ...(isInfoPanel ? {} : { controls: controlsValue }),
      },
      ...(isInfoPanel
        ? {
            infoPanel: {
              ...source.layout?.infoPanel,
              controls: controlsValue,
            },
          }
        : {}),
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

        <div className="space-y-1.5 py-2">
          <div className="flex items-center gap-2">
            <Checkbox id="ctrl-toggleable" checked={toggleable} onCheckedChange={(v) => setToggleable(!!v)} />
            <Label htmlFor="ctrl-toggleable" className="text-sm font-normal">Toggleable</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ctrl-zoom" checked={zoomToCenter} onCheckedChange={(v) => setZoomToCenter(!!v)} />
            <Label htmlFor="ctrl-zoom" className="text-sm font-normal">Zoom to Center</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ctrl-opacity" checked={opacitySlider} onCheckedChange={(v) => setOpacitySlider(!!v)} />
            <Label htmlFor="ctrl-opacity" className="text-sm font-normal">Opacity Slider</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ctrl-blend" checked={blendControls} onCheckedChange={(v) => setBlendControls(!!v)} />
            <Label htmlFor="ctrl-blend" className="text-sm font-normal">Blend Controls</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ctrl-constraint" checked={constraintSlider} onCheckedChange={(v) => setConstraintSlider(!!v)} />
            <Label htmlFor="ctrl-constraint" className="text-sm font-normal">Constraint Slider</Label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="ctrl-temporal" checked={temporalControls} onCheckedChange={(v) => {
                const checked = !!v;
                setTemporalControls(checked);
                if (!checked) setTimeframe('None');
              }} />
              <Label htmlFor="ctrl-temporal" className="text-sm font-normal">Temporal Controls</Label>
            </div>
            {temporalControls && (
              <div className="ml-6 mt-1.5">
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
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
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="ctrl-download" checked={downloadEnabled} onCheckedChange={(v) => setDownloadEnabled(!!v)} />
              <Label htmlFor="ctrl-download" className="text-sm font-normal">Download</Label>
            </div>
            {downloadEnabled && (
              <div className="ml-6 mt-1.5">
                <Input
                  className="h-8 text-sm"
                  placeholder="Download URL (optional)"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                />
              </div>
            )}
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
