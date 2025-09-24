import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2 } from 'lucide-react';
import { DataSource, Colormap } from '@/types/config';
import ColormapEditorDialog from './ColormapEditorDialog';

interface ColormapsSectionProps {
  formData: DataSource;
  onUpdate?: (field: string, value: any) => void;
}

const ColormapsSection = ({
  formData,
  onUpdate
}: ColormapsSectionProps) => {
  const colormaps = formData.meta?.colormaps || [];

  const handleColormapsUpdate = (updatedColormaps: Colormap[]) => {
    // Update the colormaps in formData through the parent's update function
    const currentMeta = formData.meta || {
      description: formData.meta?.description || '',
      attribution: formData.meta?.attribution || { text: '', url: '' }
    };
    
    const updatedMeta = {
      ...currentMeta,
      colormaps: updatedColormaps
    };
    
    // Update the formData properly (assuming updateFormData is available)
    if (typeof onUpdate === 'function') {
      onUpdate('meta.colormaps', updatedColormaps);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Colormaps</h4>
      
      {colormaps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colormaps.map((colormap, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <div className="flex flex-col text-xs">
                <span className="font-medium">{colormap.name}</span>
                <span className="text-muted-foreground">
                  {colormap.min}-{colormap.max} ({colormap.steps} steps)
                  {colormap.reverse && ' • reversed'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updatedColormaps = colormaps.filter((_, i) => i !== index);
                  onUpdate?.('colormaps', updatedColormaps);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      <ColormapEditorDialog
        colormaps={colormaps}
        onUpdate={handleColormapsUpdate}
        trigger={
          <Button type="button" variant="outline" size="sm" className="bg-white border-transparent text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-7">
            <Edit3 className="h-4 w-4 mr-2" />
            {colormaps.length > 0 ? `Edit Colormaps (${colormaps.length})` : "Add Colormaps"}
          </Button>
        }
      />
    </div>
  );
};

export default ColormapsSection;