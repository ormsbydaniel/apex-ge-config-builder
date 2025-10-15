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
  metaMin?: number;
  metaMax?: number;
}

export const useColormapEditorState = ({ colormaps, availableSourceLayers, metaMin, metaMax }: UseColormapEditorStateProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [localColormaps, setLocalColormaps] = useState<Colormap[]>([...colormaps]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Use meta.min and meta.max as default values if available
  const defaultMin = metaMin !== undefined ? metaMin : 0;
  const defaultMax = metaMax !== undefined ? metaMax : 1;
  
  const [currentColormap, setCurrentColormap] = useState<Colormap>({
    min: defaultMin,
    max: defaultMax,
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
      min: defaultMin,
      max: defaultMax,
      steps: 50,
      name: 'jet',
      reverse: false
    });
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !activeTab) {
      setActiveTab("define");
    }
  };

  const handleCancel = () => {
    setLocalColormaps([...colormaps]);
    setEditingIndex(null);
    setIsAddingNew(false);
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
    isAddingNew,
    currentColormap,
    showCopyConfirmation,
    showAppendReplaceDialog,
    selectedSourceLayer,
    pendingCopyData,
    
    // State setters
    setActiveTab,
    setLocalColormaps,
    setEditingIndex,
    setIsAddingNew,
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