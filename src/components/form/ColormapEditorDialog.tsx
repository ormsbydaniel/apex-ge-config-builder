import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Colormap } from '@/types/config';
import { COLORMAP_OPTIONS } from '@/constants/colormaps';
import { useToast } from '@/hooks/use-toast';
import ColorRampPreview from '@/components/ui/ColorRampPreview';

interface ColormapEditorDialogProps {
  colormaps: Colormap[];
  onUpdate: (colormaps: Colormap[]) => void;
  trigger: React.ReactNode;
}

const ColormapEditorDialog = ({
  colormaps,
  onUpdate,
  trigger
}: ColormapEditorDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentColormap, setCurrentColormap] = useState<Colormap>({
    min: 0,
    max: 1,
    steps: 50,
    name: 'jet',
    reverse: false
  });

  const resetColormap = () => {
    setCurrentColormap({
      min: 0,
      max: 1,
      steps: 50,
      name: 'jet',
      reverse: false
    });
  };

  const handleAdd = () => {
    setEditingIndex(null);
    resetColormap();
    setOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setCurrentColormap({ ...colormaps[index] });
    setOpen(true);
  };

  const handleSave = () => {
    if (currentColormap.min >= currentColormap.max || currentColormap.steps <= 0) {
      return;
    }

    console.log('ColormapEditorDialog: Saving colormap:', currentColormap);
    console.log('ColormapEditorDialog: Current colormaps:', colormaps);
    
    const updatedColormaps = [...colormaps];
    
    if (editingIndex !== null) {
      updatedColormaps[editingIndex] = { ...currentColormap };
      toast({
        title: "Colormap Updated",
        description: `Colormap "${currentColormap.name}" has been updated.`,
      });
    } else {
      updatedColormaps.push({ ...currentColormap });
      toast({
        title: "Colormap Added",
        description: `Colormap "${currentColormap.name}" has been added.`,
      });
    }

    console.log('ColormapEditorDialog: Updated colormaps:', updatedColormaps);
    onUpdate(updatedColormaps);
    setOpen(false);
    resetColormap();
  };

  const handleRemove = (index: number) => {
    const updatedColormaps = colormaps.filter((_, i) => i !== index);
    onUpdate(updatedColormaps);
  };

  const handleFieldChange = (field: keyof Colormap, value: any) => {
    setCurrentColormap({
      ...currentColormap,
      [field]: value
    });
  };

  const isValid = currentColormap.min < currentColormap.max && currentColormap.steps > 0;

  return (
    <>
      <div onClick={() => handleAdd()}>
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Colormap' : 'Manage Colormaps'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Colormaps List */}
            {colormaps.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Current Colormaps</h4>
                <div className="space-y-2">
                   {colormaps.map((colormap, index) => (
                     <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                       <div className="flex items-center gap-3 flex-1">
                         <ColorRampPreview 
                           colormap={colormap.name} 
                           reverse={colormap.reverse}
                           width={80}
                           height={20}
                         />
                         <div className="flex flex-col">
                           <span className="font-medium">{colormap.name}</span>
                           <span className="text-sm text-muted-foreground">
                             Range: {colormap.min} - {colormap.max} • {colormap.steps} steps
                             {colormap.reverse && ' • reversed'}
                           </span>
                         </div>
                       </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Colormap Form */}
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {editingIndex !== null ? 'Edit Colormap' : 'Add New Colormap'}
                </h4>
                {editingIndex !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingIndex(null);
                      resetColormap();
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min">Minimum Value</Label>
                  <Input
                    id="min"
                    type="number"
                    step="any"
                    value={currentColormap.min}
                    onChange={(e) => handleFieldChange('min', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="max">Maximum Value</Label>
                  <Input
                    id="max"
                    type="number"
                    step="any"
                    value={currentColormap.max}
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
                  value={currentColormap.steps}
                  onChange={(e) => handleFieldChange('steps', parseInt(e.target.value) || 10)}
                />
              </div>

              <div>
                <Label htmlFor="name">Color Ramp Name</Label>
                <Select
                  value={currentColormap.name}
                  onValueChange={(value) => handleFieldChange('name', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      {COLORMAP_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          <div className="flex items-center gap-3 w-full">
                            <ColorRampPreview 
                              colormap={option} 
                              width={180} 
                              height={16}
                            />
                            <span>{option}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="reverse"
                  checked={currentColormap.reverse}
                  onCheckedChange={(checked) => handleFieldChange('reverse', checked)}
                />
                <Label htmlFor="reverse">Reverse Colors</Label>
              </div>

              {!isValid && (
                <p className="text-sm text-red-600">
                  Please ensure minimum value is less than maximum value and steps is greater than 0.
                </p>
              )}

              <Button onClick={handleSave} disabled={!isValid} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {editingIndex !== null ? 'Update Colormap' : 'Add Colormap'}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ColormapEditorDialog;