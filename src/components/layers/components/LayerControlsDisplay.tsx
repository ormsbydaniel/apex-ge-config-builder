import React, { useState } from 'react';
import { DataSource } from '@/types/config';
import { DataSourceLayout } from '@/types/layer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SlidersHorizontal, Pencil } from 'lucide-react';
import ControlsEditorDialog from '@/components/form/ControlsEditorDialog';

interface LayerControlsDisplayProps {
  source: DataSource;
  onSave: (layoutUpdates: Partial<DataSourceLayout>, sourceFieldUpdates: Record<string, any>) => void;
}

const LayerControlsDisplay = ({ source, onSave }: LayerControlsDisplayProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const rawControls = source.layout?.layerCard?.controls || source.layout?.infoPanel?.controls;
  const toggleable = source.layout?.layerCard?.toggleable;
  const timeframe = source.timeframe;
  
  const isControlsObject = rawControls && typeof rawControls === 'object' && !Array.isArray(rawControls);
  const controls = isControlsObject ? rawControls : undefined;
  
  const hasControls = controls && (controls.opacitySlider || controls.zoomToCenter || controls.download || controls.temporalControls || controls.constraintSlider || controls.blendControls);
  const hasTimeframe = timeframe && timeframe !== 'None';
  const hasToggleable = toggleable;
  const hasDownload = controls?.download !== undefined;

  const controlsList: string[] = [];
  if (hasToggleable) controlsList.push('Toggleable');
  if (controls?.zoomToCenter) controlsList.push('Zoom to Center');
  if (controls?.opacitySlider) controlsList.push('Opacity Slider');
  if (controls?.temporalControls) controlsList.push('Temporal Control');
  if (controls?.constraintSlider) controlsList.push('Constraint Slider');
  if (controls?.blendControls) controlsList.push('Blend Controls');

  const hasAny = hasControls || hasTimeframe || hasToggleable;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Controls</h4>
        {!hasAny && <span className="text-xs italic text-muted-foreground">(None)</span>}
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDialogOpen(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      {hasAny && (
        <div className="flex flex-wrap gap-1 ml-6">
          {controlsList.map((control, index) => (
            <Badge key={index} variant="outline" className="text-[11px] font-normal border-blue-500/20 text-blue-600/80">
              {control}
            </Badge>
          ))}
          {hasTimeframe && (
            <Badge variant="outline" className="text-[11px] font-normal border-purple-500/20 text-purple-600/80">
              Time: {timeframe}
            </Badge>
          )}
          {hasDownload && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[11px] font-normal border-green-500/20 text-green-600/80 cursor-help">
                    Download
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="max-w-xs break-all text-sm">
                    {controls?.download || 'No URL configured'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      <ControlsEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        source={source}
        onSave={onSave}
      />
    </div>
  );
};

export default LayerControlsDisplay;