import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft } from 'lucide-react';

interface BandSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cogBandCount: number;
  currentBands: number[];
  onSave: (bands: number[], applyToAll: boolean) => void;
  cogCount: number;
  bandLabels?: string[];
}

export function BandSelectorDialog({
  open,
  onOpenChange,
  cogBandCount,
  currentBands,
  onSave,
  cogCount,
  bandLabels,
}: BandSelectorDialogProps) {
  const [selectedBands, setSelectedBands] = useState<number[]>([]);
  const [leftSelected, setLeftSelected] = useState<Set<number>>(new Set());
  const [rightSelected, setRightSelected] = useState<Set<number>>(new Set());
  const [applyToAll, setApplyToAll] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBands([...currentBands]);
      setLeftSelected(new Set());
      setRightSelected(new Set());
      setApplyToAll(false);
    }
  }, [open, currentBands]);

  // All band indices (1-based)
  const allBands = useMemo(
    () => Array.from({ length: cogBandCount }, (_, i) => i + 1),
    [cogBandCount]
  );

  // Available = all bands not in selected
  const availableBands = useMemo(
    () => allBands.filter((b) => !selectedBands.includes(b)),
    [allBands, selectedBands]
  );

  const getBandLabel = (band: number) => {
    const label = bandLabels?.[band - 1];
    return label ? `Band ${band} (${label})` : `Band ${band}`;
  };

  // Transfer buttons
  const moveRight = () => {
    if (leftSelected.size === 0) return;
    setSelectedBands((prev) => [...prev, ...Array.from(leftSelected).sort((a, b) => a - b)]);
    setLeftSelected(new Set());
  };

  const moveAllRight = () => {
    setSelectedBands((prev) => [...prev, ...availableBands]);
    setLeftSelected(new Set());
  };

  const moveLeft = () => {
    if (rightSelected.size === 0) return;
    setSelectedBands((prev) => prev.filter((b) => !rightSelected.has(b)));
    setRightSelected(new Set());
  };

  const moveAllLeft = () => {
    setSelectedBands([]);
    setRightSelected(new Set());
  };

  // Reorder buttons
  const moveUp = () => {
    if (rightSelected.size !== 1) return;
    const band = Array.from(rightSelected)[0];
    const idx = selectedBands.indexOf(band);
    if (idx <= 0) return;
    const next = [...selectedBands];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setSelectedBands(next);
  };

  const moveDown = () => {
    if (rightSelected.size !== 1) return;
    const band = Array.from(rightSelected)[0];
    const idx = selectedBands.indexOf(band);
    if (idx === -1 || idx >= selectedBands.length - 1) return;
    const next = [...selectedBands];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setSelectedBands(next);
  };

  const toggleLeftItem = (band: number) => {
    setLeftSelected((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  };

  const toggleRightItem = (band: number) => {
    setRightSelected((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  };

  const handleSave = () => {
    onSave(selectedBands, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Band Selection</DialogTitle>
          <DialogDescription>
            Choose which bands to include and their display order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-stretch h-[320px] flex-shrink-0">
          {/* Available Bands */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Available Bands ({availableBands.length})
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-1">
                {availableBands.map((band) => (
                  <div
                    key={band}
                    onClick={() => toggleLeftItem(band)}
                    className={`px-2 py-1.5 text-xs rounded cursor-pointer select-none transition-colors ${
                      leftSelected.has(band)
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {getBandLabel(band)}
                  </div>
                ))}
                {availableBands.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    All bands selected
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Transfer Buttons */}
          <div className="flex flex-col items-center justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={moveRight}
              disabled={leftSelected.size === 0}
              title="Move selected right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={moveAllRight}
              disabled={availableBands.length === 0}
              title="Move all right"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={moveLeft}
              disabled={rightSelected.size === 0}
              title="Move selected left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={moveAllLeft}
              disabled={selectedBands.length === 0}
              title="Move all left"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Selected Bands */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Selected Bands ({selectedBands.length})
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-1">
                {selectedBands.map((band, idx) => (
                  <div
                    key={band}
                    onClick={() => toggleRightItem(band)}
                    className={`px-2 py-1.5 text-xs rounded cursor-pointer select-none transition-colors flex items-center gap-1 ${
                      rightSelected.has(band)
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-muted-foreground w-4 text-right flex-shrink-0">{idx + 1}.</span>
                    {getBandLabel(band)}
                  </div>
                ))}
                {selectedBands.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No bands selected
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Reorder Buttons */}
          <div className="flex flex-col items-center justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={moveUp}
              disabled={rightSelected.size !== 1}
              title="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={moveDown}
              disabled={rightSelected.size !== 1}
              title="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Apply to all checkbox */}
        {cogCount > 1 && (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="apply-to-all"
              checked={applyToAll}
              onCheckedChange={(checked) => setApplyToAll(checked === true)}
            />
            <label htmlFor="apply-to-all" className="text-sm text-muted-foreground cursor-pointer">
              Apply to all COG sources in this layer ({cogCount} COGs)
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
