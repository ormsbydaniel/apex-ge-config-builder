
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LayerTypeOption } from '@/hooks/useLayerOperations';

interface LayerTypeRadioGroupProps {
  value: LayerTypeOption;
  onChange: (value: LayerTypeOption) => void;
  disabled?: boolean;
}

const LayerTypeRadioGroup = ({ value, onChange, disabled = false }: LayerTypeRadioGroupProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-lg font-medium">Layer Type</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Choose the layer type. Comparison layers (Swipe, Mirror, Spotlight) require position settings for data sources.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <RadioGroup 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="standard" id="standard" />
          <Label htmlFor="standard" className="font-normal">
            Standard
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="swipe" id="swipe" />
          <Label htmlFor="swipe" className="font-normal">
            Swipe
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="mirror" id="mirror" />
          <Label htmlFor="mirror" className="font-normal">
            Mirror
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="spotlight" id="spotlight" />
          <Label htmlFor="spotlight" className="font-normal">
            Spotlight
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default LayerTypeRadioGroup;
