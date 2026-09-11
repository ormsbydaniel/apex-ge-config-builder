import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Map } from 'lucide-react';
import { DataSource } from '@/types/config';

interface RecommendedBaseLayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: DataSource[];
  onConfirm: (selectedLayers: DataSource[]) => void;
}

const getLayerKey = (layer: DataSource, index: number) =>
  layer.data?.[0]?.url || layer.name || `layer-${index}`;

const RecommendedBaseLayersModal = ({ isOpen, onClose, layers, onConfirm }: RecommendedBaseLayersModalProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(layers.map(getLayerKey)));

  // Reset selections when the layer list changes
  React.useEffect(() => {
    setSelectedIds(new Set(layers.map(getLayerKey)));
  }, [layers]);

  const handleToggle = (key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === layers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(layers.map(getLayerKey)));
    }
  };

  const handleConfirm = () => {
    const selected = layers.filter((layer, index) => selectedIds.has(getLayerKey(layer, index)));
    onConfirm(selected);
  };

  const allSelected = selectedIds.size === layers.length;
  const noneSelected = selectedIds.size === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Recommended Base Layers</DialogTitle>
          <DialogDescription>
            Select the base layers you want to add. Base layers already configured are excluded.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            id="select-all-base-layers"
          />
          <label htmlFor="select-all-base-layers" className="text-sm font-medium cursor-pointer">
            {allSelected ? 'Deselect All' : 'Select All'} ({selectedIds.size}/{layers.length})
          </label>
        </div>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-2">
            {layers.map((layer, index) => {
              const key = getLayerKey(layer, index);
              const isSelected = selectedIds.has(key);
              const url = layer.data?.[0]?.url;
              return (
                <div
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggle(key)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(key)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm truncate">{layer.name}</span>
                    </div>
                    {url && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{url}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={noneSelected}>
            {`Add ${selectedIds.size} Base Layer${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendedBaseLayersModal;
