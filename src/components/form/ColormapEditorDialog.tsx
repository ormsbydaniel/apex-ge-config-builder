import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Colormap, DataSource } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useColormapEditorState } from '@/hooks/useColormapEditorState';
import ColormapEditorTabs from './ColormapEditorTabs';

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
  const { config } = useConfig();

  // Find layers with colormaps (excluding current layer being edited)
  const availableSourceLayers = config.sources
    .filter((source: DataSource) => 
      source.meta?.colormaps && 
      source.meta.colormaps.length > 0
    )
    .map((source: DataSource) => ({
      name: source.name,
      colormaps: source.meta?.colormaps || []
    }));

  const {
    open,
    activeTab,
    localColormaps,
    editingIndex,
    currentColormap,
    showCopyConfirmation,
    showAppendReplaceDialog,
    selectedSourceLayer,
    pendingCopyData,
    setActiveTab,
    setLocalColormaps,
    setEditingIndex,
    setCurrentColormap,
    setShowCopyConfirmation,
    setShowAppendReplaceDialog,
    setSelectedSourceLayer,
    setPendingCopyData,
    resetColormap,
    handleOpen,
    handleCancel,
    performCopy
  } = useColormapEditorState({ colormaps, availableSourceLayers });

  const handleAdd = () => {
    handleOpen(true);
  };

  const handleSave = () => {
    onUpdate(localColormaps);
    handleOpen(false);
  };

  const handleCopyFromLayer = () => {
    const sourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);
    if (!sourceLayerData) return;

    if (localColormaps.length > 0) {
      setPendingCopyData(sourceLayerData);
      setShowAppendReplaceDialog(true);
    } else {
      performCopy(sourceLayerData, 'replace');
    }
  };

  // Check if there are any changes to save
  const hasChanges = JSON.stringify(localColormaps) !== JSON.stringify(colormaps);
  const canSave = hasChanges && localColormaps.length > 0;

  return (
    <>
      <div onClick={() => handleAdd()}>
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Colormaps</DialogTitle>
          </DialogHeader>
          
          <ColormapEditorTabs
            activeTab={activeTab}
            localColormaps={localColormaps}
            editingIndex={editingIndex}
            currentColormap={currentColormap}
            availableSourceLayers={availableSourceLayers}
            selectedSourceLayer={selectedSourceLayer}
            onActiveTabChange={setActiveTab}
            onSetLocalColormaps={setLocalColormaps}
            onSetEditingIndex={setEditingIndex}
            onSetCurrentColormap={setCurrentColormap}
            onResetColormap={resetColormap}
            onSetSelectedSourceLayer={setSelectedSourceLayer}
            onCopyFromLayer={handleCopyFromLayer}
          />

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button onClick={handleSave} disabled={!canSave}>
                      Save Changes
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSave && (
                  <TooltipContent>
                    <p>
                      {localColormaps.length === 0 
                        ? "Add or copy a colormap to save changes"
                        : "No changes to save"}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Append/Replace Confirmation Dialog */}
      <AlertDialog open={showAppendReplaceDialog} onOpenChange={setShowAppendReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How would you like to copy the colormaps?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have {localColormaps.length} colormap(s) configured. Would you like to replace them or append the new ones?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAppendReplaceDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingCopyData && performCopy(pendingCopyData, 'append')}>
              Append ({pendingCopyData?.colormaps.length || 0} more)
            </AlertDialogAction>
            <AlertDialogAction onClick={() => pendingCopyData && performCopy(pendingCopyData, 'replace')}>
              Replace (with {pendingCopyData?.colormaps.length || 0})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ColormapEditorDialog;