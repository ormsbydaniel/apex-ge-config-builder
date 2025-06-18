
import React from 'react';
import { FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LayerTypeOption } from '@/hooks/useLayerTypeManagement';

interface LayerTypeRadioGroupProps {
  value: LayerTypeOption;
  onChange: (value: LayerTypeOption) => void;
  disabled?: boolean;
}

const LayerTypeRadioGroup = ({ value, onChange, disabled = false }: LayerTypeRadioGroupProps) => {
  return (
    <FormItem>
      <FormLabel>Layer Type</FormLabel>
      <FormControl>
        <RadioGroup 
          value={value} 
          onValueChange={onChange}
          disabled={disabled}
          className="grid grid-cols-2 gap-4"
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
      </FormControl>
      <FormDescription>
        Choose the layer type. Comparison layers (Swipe, Mirror, Spotlight) require position settings for data sources.
      </FormDescription>
    </FormItem>
  );
};

export default LayerTypeRadioGroup;
