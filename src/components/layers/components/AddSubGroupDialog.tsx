import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface AvailableLayer {
  name: string;
  index: number;
}

interface AddSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (subGroupName: string, selectedLayerIndices: number[]) => void;
  onCreateNewLayer: (subGroupName: string) => void;
  parentInterfaceGroup: string;
  existingSubGroups: string[];
  availableLayers: AvailableLayer[];
}

const AddSubGroupDialog = ({
  open,
  onOpenChange,
  onAdd,
  onCreateNewLayer,
  parentInterfaceGroup,
  existingSubGroups,
  availableLayers
}: AddSubGroupDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [subGroupName, setSubGroupName] = useState('');
  const [selectedLayers, setSelectedLayers] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');

    if (!subGroupName.trim()) {
      setError('Sub-group name is required');
      return;
    }

    if (existingSubGroups.includes(subGroupName.trim())) {
      setError('A sub-group with this name already exists');
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCreate = () => {
    onAdd(subGroupName.trim(), Array.from(selectedLayers));
    handleClose();
  };

  const handleCreateNewLayer = () => {
    onCreateNewLayer(subGroupName.trim());
    handleClose();
  };

  const handleClose = () => {
    // Reset all state
    setStep(1);
    setSubGroupName('');
    setSelectedLayers(new Set());
    setError('');
    onOpenChange(false);
  };

  const handleLayerToggle = (layerIndex: number, checked: boolean) => {
    const newSelected = new Set(selectedLayers);
    if (checked) {
      newSelected.add(layerIndex);
    } else {
      newSelected.delete(layerIndex);
    }
    setSelectedLayers(newSelected);
  };

  const isCreateDisabled = availableLayers.length > 0 && selectedLayers.size === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sub-Group to "{parentInterfaceGroup}"</DialogTitle>
        </DialogHeader>

        {/* Step 1: Define Sub-Group Name */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a sub-group to organize layers within "{parentInterfaceGroup}".
            </p>
            <div>
              <Label htmlFor="subGroupName">Sub-Group Name *</Label>
              <Input
                id="subGroupName"
                value={subGroupName}
                onChange={(e) => setSubGroupName(e.target.value)}
                placeholder="Enter sub-group name"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="mt-1"
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Layers */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select existing layers to move into "{subGroupName}":
            </p>

            {availableLayers.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {availableLayers.map(layer => (
                  <div key={layer.index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`layer-${layer.index}`}
                      checked={selectedLayers.has(layer.index)}
                      onCheckedChange={(checked) => handleLayerToggle(layer.index, !!checked)}
                    />
                    <Label 
                      htmlFor={`layer-${layer.index}`} 
                      className="cursor-pointer text-sm font-normal"
                    >
                      {layer.name}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                No ungrouped layers available. Create a new layer to start this sub-group.
              </p>
            )}

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              onClick={handleCreateNewLayer}
              className="w-full text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Layer
            </Button>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isCreateDisabled}
              >
                Create Sub-Group
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubGroupDialog;
