
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal } from 'lucide-react';

interface BatchActionsPanelProps {
  selectedCount: number;
  onAdjustZLevels: (adjustment: number) => void;
  onSetZLevels: (zLevel: number) => void;
  onMultiplyZLevels: (multiplier: number) => void;
  minZLevel: number;
  maxZLevel: number;
  isMoreDialogOpen: boolean;
  setIsMoreDialogOpen: (open: boolean) => void;
}

const BatchActionsPanel = ({ 
  selectedCount, 
  onAdjustZLevels, 
  onSetZLevels,
  onMultiplyZLevels,
  minZLevel,
  maxZLevel,
  isMoreDialogOpen, 
  setIsMoreDialogOpen 
}: BatchActionsPanelProps) => {
  const [multiplierValue, setMultiplierValue] = useState('10');

  const handleDrawFirst = () => {
    onSetZLevels(minZLevel - 1);
    setIsMoreDialogOpen(false);
  };

  const handleDrawLast = () => {
    onSetZLevels(maxZLevel + 1);
    setIsMoreDialogOpen(false);
  };

  const handleMultiply = () => {
    const multiplier = parseFloat(multiplierValue);
    if (!isNaN(multiplier) && multiplier > 0) {
      onMultiplyZLevels(multiplier);
      setIsMoreDialogOpen(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-background border rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Actions for selected layers ({selectedCount} selected):
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAdjustZLevels(1)}
          disabled={selectedCount === 0}
        >
          Increase by 1
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAdjustZLevels(-1)}
          disabled={selectedCount === 0}
        >
          Decrease by 1
        </Button>
        <Dialog open={isMoreDialogOpen} onOpenChange={setIsMoreDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount === 0}
            >
              <MoreHorizontal className="h-4 w-4" />
              More...
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Additional Actions</DialogTitle>
              <DialogDescription>
                Additional batch actions for selected layers.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Button
                  onClick={handleDrawFirst}
                  className="w-full"
                  variant="outline"
                >
                  Draw First
                </Button>
                <p className="text-xs text-muted-foreground">
                  Set Z-level to {minZLevel - 1} (one lower than current lowest)
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleDrawLast}
                  className="w-full"
                  variant="outline"
                >
                  Draw Last
                </Button>
                <p className="text-xs text-muted-foreground">
                  Set Z-level to {maxZLevel + 1} (one higher than current highest)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={multiplierValue}
                    onChange={(e) => setMultiplierValue(e.target.value)}
                    placeholder="10"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleMultiply}
                    variant="outline"
                    disabled={!multiplierValue || isNaN(parseFloat(multiplierValue))}
                  >
                    Multiply by
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Multiplying the Z order (e.g. x 10) is useful to "expand" a group e.g. 1, 2, 3 → 10, 20, 30 to add other layers in the middle.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BatchActionsPanel;
