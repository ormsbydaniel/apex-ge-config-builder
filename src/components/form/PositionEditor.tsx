
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PositionValue, getValidPositions, getPositionDisplayName } from '@/utils/positionUtils';
import { LayerTypeOption } from '@/hooks/useLayerTypeManagement';

interface PositionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  layerType: LayerTypeOption;
  currentPosition?: PositionValue;
  onSave: (position: PositionValue) => void;
  dataSourceName?: string;
}

const PositionEditor = ({
  isOpen,
  onClose,
  layerType,
  currentPosition,
  onSave,
  dataSourceName
}: PositionEditorProps) => {
  const [selectedPosition, setSelectedPosition] = React.useState<PositionValue | undefined>(currentPosition);
  const validPositions = getValidPositions(layerType);

  React.useEffect(() => {
    setSelectedPosition(currentPosition);
  }, [currentPosition, isOpen]);

  const handleSave = () => {
    if (selectedPosition) {
      onSave(selectedPosition);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Position</DialogTitle>
          <DialogDescription>
            Choose the position for {dataSourceName || 'this data source'} in the {layerType} layer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Label>Position</Label>
          <RadioGroup 
            value={selectedPosition} 
            onValueChange={(value) => setSelectedPosition(value as PositionValue)}
          >
            {validPositions.map((position) => (
              <div key={position} className="flex items-center space-x-2">
                <RadioGroupItem value={position} id={position} />
                <Label htmlFor={position} className="font-normal">
                  {getPositionDisplayName(position)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedPosition}>
            Save Position
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PositionEditor;
