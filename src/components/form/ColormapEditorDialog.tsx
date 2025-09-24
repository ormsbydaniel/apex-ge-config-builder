import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Colormap } from '@/types/config';
import { COLORMAP_OPTIONS } from '@/constants/colormaps';

interface ColormapEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  colormap: Colormap;
  onColormapChange: (colormap: Colormap) => void;
  isEditing: boolean;
}

const ColormapEditorDialog = ({
  open,
  onClose,
  onSave,
  colormap,
  onColormapChange,
  isEditing
}: ColormapEditorDialogProps) => {
  const handleFieldChange = (field: keyof Colormap, value: any) => {
    onColormapChange({
      ...colormap,
      [field]: value
    });
  };

  const isValid = colormap.min < colormap.max && colormap.steps > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Colormap' : 'Add Colormap'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Minimum Value</Label>
              <Input
                id="min"
                type="number"
                step="any"
                value={colormap.min}
                onChange={(e) => handleFieldChange('min', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="max">Maximum Value</Label>
              <Input
                id="max"
                type="number"
                step="any"
                value={colormap.max}
                onChange={(e) => handleFieldChange('max', parseFloat(e.target.value) || 1)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="steps">Steps</Label>
            <Input
              id="steps"
              type="number"
              min="1"
              value={colormap.steps}
              onChange={(e) => handleFieldChange('steps', parseInt(e.target.value) || 10)}
            />
          </div>

          <div>
            <Label htmlFor="name">Color Ramp Name</Label>
            <Select
              value={colormap.name}
              onValueChange={(value) => handleFieldChange('name', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORMAP_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="reverse"
              checked={colormap.reverse}
              onCheckedChange={(checked) => handleFieldChange('reverse', checked)}
            />
            <Label htmlFor="reverse">Reverse Colors</Label>
          </div>

          {!isValid && (
            <p className="text-sm text-red-600">
              Please ensure minimum value is less than maximum value and steps is greater than 0.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!isValid}>
            {isEditing ? 'Update' : 'Add'} Colormap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColormapEditorDialog;