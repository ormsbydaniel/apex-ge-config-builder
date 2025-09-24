import { useState } from 'react';
import { Colormap, DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

export const useColormaps = (
  formData: DataSource,
  updateFormData: (path: string, value: any) => void
) => {
  const { toast } = useToast();
  const [newColormap, setNewColormap] = useState<Colormap>({ 
    min: 0,
    max: 1,
    steps: 10,
    name: 'jet',
    reverse: false
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addColormap = () => {
    if (newColormap.min < newColormap.max && newColormap.steps > 0) {
      const colormapToAdd: Colormap = { ...newColormap };
      
      updateFormData('meta.colormaps', [...(formData.meta?.colormaps || []), colormapToAdd]);
      setNewColormap({ 
        min: 0,
        max: 1,
        steps: 10,
        name: 'jet',
        reverse: false
      });
      toast({
        title: "Colormap Added",
        description: `Colormap "${newColormap.name}" has been added.`,
      });
    }
  };

  const updateColormap = (index: number) => {
    if (newColormap.min < newColormap.max && newColormap.steps > 0) {
      const updatedColormaps = [...(formData.meta?.colormaps || [])];
      updatedColormaps[index] = { ...newColormap };
      
      updateFormData('meta.colormaps', updatedColormaps);
      setEditingIndex(null);
      setNewColormap({ 
        min: 0,
        max: 1,
        steps: 10,
        name: 'jet',
        reverse: false
      });
      toast({
        title: "Colormap Updated",
        description: `Colormap "${newColormap.name}" has been updated.`,
      });
    }
  };

  const removeColormap = (index: number) => {
    const updatedColormaps = formData.meta?.colormaps?.filter((_, i) => i !== index) || [];
    updateFormData('meta.colormaps', updatedColormaps);
    
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewColormap({ 
        min: 0,
        max: 1,
        steps: 10,
        name: 'jet',
        reverse: false
      });
    }
  };

  const startEditing = (index: number) => {
    const colormap = formData.meta?.colormaps?.[index];
    if (colormap) {
      setNewColormap({ ...colormap });
      setEditingIndex(index);
    }
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setNewColormap({ 
      min: 0,
      max: 1,
      steps: 10,
      name: 'jet',
      reverse: false
    });
  };

  return {
    newColormap,
    setNewColormap,
    editingIndex,
    addColormap,
    updateColormap,
    removeColormap,
    startEditing,
    cancelEditing
  };
};