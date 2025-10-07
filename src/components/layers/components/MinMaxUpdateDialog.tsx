import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DataSourceMeta } from '@/types/config';

interface MinMaxUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMeta: DataSourceMeta;
  newMin: number;
  newMax: number;
  onConfirm: (updateMin: boolean, updateMax: boolean, updateColormaps: boolean) => void;
}

const MinMaxUpdateDialog = ({
  isOpen,
  onClose,
  currentMeta,
  newMin,
  newMax,
  onConfirm,
}: MinMaxUpdateDialogProps) => {
  const [updateMin, setUpdateMin] = useState(true);
  const [updateMax, setUpdateMax] = useState(true);
  const [updateColormaps, setUpdateColormaps] = useState(false);

  const hasColormaps = currentMeta.colormaps && currentMeta.colormaps.length > 0;

  const handleConfirm = () => {
    onConfirm(updateMin, updateMax, updateColormaps);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Min/Max Values</DialogTitle>
          <DialogDescription>
            Compare current values with COG metadata and select which to update.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comparison Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="py-2 px-3 text-left font-medium">Property</th>
                  <th className="py-2 px-3 text-left font-medium">Current</th>
                  <th className="py-2 px-3 text-left font-medium">New</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2 px-3 font-medium">Min</td>
                  <td className="py-2 px-3 font-mono">{currentMeta.min ?? 'Not set'}</td>
                  <td className="py-2 px-3 font-mono">{newMin}</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 px-3 font-medium">Max</td>
                  <td className="py-2 px-3 font-mono">{currentMeta.max ?? 'Not set'}</td>
                  <td className="py-2 px-3 font-mono">{newMax}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Selection Checkboxes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-min"
                checked={updateMin}
                onCheckedChange={(checked) => setUpdateMin(checked as boolean)}
              />
              <Label htmlFor="update-min" className="text-sm font-medium cursor-pointer">
                Update min value
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-max"
                checked={updateMax}
                onCheckedChange={(checked) => setUpdateMax(checked as boolean)}
              />
              <Label htmlFor="update-max" className="text-sm font-medium cursor-pointer">
                Update max value
              </Label>
            </div>

            {hasColormaps && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="update-colormaps"
                  checked={updateColormaps}
                  onCheckedChange={(checked) => setUpdateColormaps(checked as boolean)}
                />
                <Label htmlFor="update-colormaps" className="text-sm font-medium cursor-pointer">
                  Update colormap min/max values
                  <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                    {currentMeta.colormaps!.length} colormap{currentMeta.colormaps!.length !== 1 ? 's' : ''} will be updated
                  </span>
                </Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!updateMin && !updateMax}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MinMaxUpdateDialog;
