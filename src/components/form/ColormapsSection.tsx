import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { DataSource, Colormap } from '@/types/config';
import ColormapEditorDialog from './ColormapEditorDialog';

interface ColormapsSectionProps {
  formData: DataSource;
  newColormap: Colormap;
  showColormaps: boolean;
  editingIndex: number | null;
  onSetNewColormap: (colormap: Colormap) => void;
  onSetShowColormaps: (show: boolean) => void;
  onAddColormap: () => void;
  onUpdateColormap: (index: number) => void;
  onRemoveColormap: (index: number) => void;
  onStartEditing: (index: number) => void;
  onCancelEditing: () => void;
}

const ColormapsSection = ({
  formData,
  newColormap,
  showColormaps,
  editingIndex,
  onSetNewColormap,
  onSetShowColormaps,
  onAddColormap,
  onUpdateColormap,
  onRemoveColormap,
  onStartEditing,
  onCancelEditing
}: ColormapsSectionProps) => {
  const [showEditor, setShowEditor] = React.useState(false);

  const handleAddClick = () => {
    setShowEditor(true);
  };

  const handleEditClick = (index: number) => {
    onStartEditing(index);
    setShowEditor(true);
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      onUpdateColormap(editingIndex);
    } else {
      onAddColormap();
    }
    setShowEditor(false);
  };

  const handleCancel = () => {
    onCancelEditing();
    setShowEditor(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Colormaps (Optional)</h3>
        <Switch
          checked={showColormaps}
          onCheckedChange={onSetShowColormaps}
        />
      </div>
      
      {showColormaps && (
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
          <p className="text-sm text-slate-600">
            Define color mappings for data visualization
          </p>
          
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Current Colormaps</h4>
            <Button type="button" onClick={handleAddClick} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Colormap
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.meta?.colormaps?.map((colormap, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                <div className="flex flex-col text-xs">
                  <span className="font-medium">{colormap.name}</span>
                  <span className="text-muted-foreground">
                    {colormap.min}-{colormap.max} ({colormap.steps} steps)
                    {colormap.reverse && ' • reversed'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEditClick(index)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveColormap(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </Badge>
            ))}
            {(!formData.meta?.colormaps || formData.meta.colormaps.length === 0) && (
              <span className="text-sm text-muted-foreground">No colormaps added yet</span>
            )}
          </div>
        </div>
      )}

      <ColormapEditorDialog
        open={showEditor}
        onClose={handleCancel}
        onSave={handleSave}
        colormap={newColormap}
        onColormapChange={onSetNewColormap}
        isEditing={editingIndex !== null}
      />
    </div>
  );
};

export default ColormapsSection;