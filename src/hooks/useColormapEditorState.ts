import { useState } from 'react';
import { Colormap } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface AvailableSourceLayer {
  name: string;
  colormaps: Colormap[];
}

interface UseColormapEditorStateProps {
  colormaps: Colormap[];
  availableSourceLayers: AvailableSourceLayer[];
}

export const useColormapEditorState = ({ colormaps, availableSourceLayers }: UseColormapEditorStateProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [localColormaps, setLocalColormaps] = useState<Colormap[]>([...colormaps]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentColormap, setCurrentColormap] = useState<Colormap>({
    min: 0,
    max: 1,
    steps: 50,
    name: 'jet',
    reverse: false
  });
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [showAppendReplaceDialog, setShowAppendReplaceDialog] = useState(false);
  const [selectedSourceLayer, setSelectedSourceLayer] = useState<string>('');
  const [pendingCopyData, setPendingCopyData] = useState<{ 
    colormaps: Colormap[]; 
    name: string 
  } | null>(null);

  const resetColormap = () => {
    setCurrentColormap({
      min: 0,
      max: 1,
      steps: 50,
      name: 'jet',
      reverse: false
    });
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !activeTab) {
      const defaultTab = localColormaps.length === 0 && availableSourceLayers.length > 0 ? "copy" : "define";
      setActiveTab(defaultTab);
    }
  };

  const handleCancel = () => {
    setLocalColormaps([...colormaps]);
    setEditingIndex(null);
    resetColormap();
    setActiveTab('');
    setSelectedSourceLayer('');
    setOpen(false);
  };

  const performCopy = (sourceLayer: { colormaps: Colormap[]; name: string }, mode: 'append' | 'replace') => {
    const copiedColormaps = sourceLayer.colormaps.map(colormap => ({ ...colormap }));
    
    let finalColormaps: Colormap[];
    if (mode === 'append') {
      finalColormaps = [...localColormaps, ...copiedColormaps];
    } else {
      finalColormaps = copiedColormaps;
    }
    
    setLocalColormaps(finalColormaps);
    setShowCopyConfirmation(false);
    setShowAppendReplaceDialog(false);
    setPendingCopyData(null);
    setActiveTab('define');
    
    const actionText = mode === 'append' ? 'Appended' : 'Copied';
    toast({
      title: `Colormaps ${actionText}`,
      description: `${actionText} ${copiedColormaps.length} colormaps from "${sourceLayer.name}".`,
    });
  };

  return {
    // State
    open,
    activeTab,
    localColormaps,
    editingIndex,
    currentColormap,
    showCopyConfirmation,
    showAppendReplaceDialog,
    selectedSourceLayer,
    pendingCopyData,
    
    // State setters
    setActiveTab,
    setLocalColormaps,
    setEditingIndex,
    setCurrentColormap,
    setShowCopyConfirmation,
    setShowAppendReplaceDialog,
    setSelectedSourceLayer,
    setPendingCopyData,
    
    // Helpers
    resetColormap,
    
    // Handlers
    handleOpen,
    handleCancel,
    performCopy
  };
};