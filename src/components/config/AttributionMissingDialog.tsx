
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataSource } from '@/types/config';
import { useTableSelection } from '@/hooks/useTableSelection';

interface LayerWithGroup {
  layer: DataSource;
  index: number;
  group: string;
}

interface AttributionMissingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
  onUpdateLayers: (updates: Array<{ index: number; attribution: { text: string; url?: string } }>) => void;
}

const AttributionMissingDialog = ({
  open,
  onOpenChange,
  config,
  onUpdateLayers
}: AttributionMissingDialogProps) => {
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');

  // Get layers missing attribution
  const layersWithoutAttribution = React.useMemo(() => {
    const layers: LayerWithGroup[] = [];
    
    config.sources.forEach((source: DataSource, index: number) => {
      const hasAttribution = source.meta?.attribution?.text;
      
      if (!hasAttribution) {
        let group = 'Ungrouped';
        
        if (source.isBaseLayer) {
          group = 'Base Layers';
        } else if (source.layout?.interfaceGroup) {
          group = source.layout.interfaceGroup;
        }
        
        layers.push({
          layer: source,
          index,
          group
        });
      }
    });
    
    return layers;
  }, [config.sources]);

  const {
    selectedItems,
    handleItemSelection,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isPartiallySelected
  } = useTableSelection({
    items: layersWithoutAttribution,
    getItemKey: (item) => `${item.index}`
  });

  const handleApply = () => {
    if (selectedItems.size === 0 || !attributionText.trim()) return;

    const updates = Array.from(selectedItems).map(key => ({
      index: parseInt(key),
      attribution: {
        text: attributionText.trim(),
        url: attributionUrl.trim() || undefined
      }
    }));

    onUpdateLayers(updates);
    
    // Clear form
    setAttributionText('');
    setAttributionUrl('');
    clearSelection();
  };

  const handleRowClick = (event: React.MouseEvent, layerKey: string) => {
    const isChecked = selectedItems.has(layerKey);
    handleItemSelection(layerKey, !isChecked, event.shiftKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Layers Missing Attribution</DialogTitle>
          <DialogDescription>
            Select layers to add attribution information in bulk. Click and Shift+click to select multiple layers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {layersWithoutAttribution.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              All layers have attribution information.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all layers"
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                        />
                      </TableHead>
                      <TableHead>Layer Name</TableHead>
                      <TableHead>Interface Group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {layersWithoutAttribution.map((item) => {
                      const layerKey = `${item.index}`;
                      const isSelected = selectedItems.has(layerKey);
                      
                      return (
                        <TableRow
                          key={layerKey}
                          className={`cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                          onClick={(e) => handleRowClick(e, layerKey)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleItemSelection(layerKey, checked as boolean)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.layer.name}
                          </TableCell>
                          <TableCell>{item.group}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attribution-text">Attribution Text *</Label>
                    <Input
                      id="attribution-text"
                      value={attributionText}
                      onChange={(e) => setAttributionText(e.target.value)}
                      placeholder="e.g., © OpenStreetMap contributors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attribution-url">Attribution URL (optional)</Label>
                    <Input
                      id="attribution-url"
                      value={attributionUrl}
                      onChange={(e) => setAttributionUrl(e.target.value)}
                      placeholder="e.g., https://www.openstreetmap.org/copyright"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedItems.size} of {layersWithoutAttribution.length} layers selected
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleApply}
                      disabled={selectedItems.size === 0 || !attributionText.trim()}
                    >
                      Apply Attribution
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttributionMissingDialog;
