
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { Category } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';
import { useCategoryEditorState } from '@/hooks/useCategoryEditorState';
import { normalizeCategories } from '@/utils/categoryValidation';
import CategoryEditorTabs from './CategoryEditorTabs';
import CategoryCopyLogic from './CategoryCopyLogic';

interface CategoryEditorDialogProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
  trigger?: React.ReactNode;
  layerName?: string;
}

const CategoryEditorDialog = ({ categories, onUpdate, trigger, layerName }: CategoryEditorDialogProps) => {
  const { config } = useConfig();
  const { toast } = useToast();

  // Get available layers with categories for copying
  const availableSourceLayers = config.sources
    .filter(source => source.meta?.categories && source.meta.categories.length > 0)
    .map(source => {
      const normalizedCategories = normalizeCategories(source.meta?.categories || []);
      return {
        name: source.name || 'Unnamed Layer',
        categories: normalizedCategories,
        hasValues: normalizedCategories.some(cat => cat.value !== undefined)
      };
    });

  const {
    open,
    activeTab,
    localCategories,
    useValues,
    newCategory,
    showCopyConfirmation,
    showAppendReplaceDialog,
    selectedSourceLayer,
    pendingCopyData,
    setActiveTab,
    setLocalCategories,
    setUseValues,
    setNewCategory,
    setShowCopyConfirmation,
    setShowAppendReplaceDialog,
    setSelectedSourceLayer,
    setPendingCopyData,
    handleOpen,
    handleCancel,
    performCopy
  } = useCategoryEditorState({ categories, availableSourceLayers });

  const handleCopyFromLayer = () => {
    if (!selectedSourceLayer) return;
    
    const sourceLayer = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);
    if (!sourceLayer) return;

    if (localCategories.length > 0) {
      setPendingCopyData(sourceLayer);
      setShowAppendReplaceDialog(true);
    } else {
      performCopy(sourceLayer, 'replace');
    }
  };

  const handleSave = () => {
    if (activeTab === 'copy' && selectedSourceLayer) {
      const sourceLayer = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);
      if (sourceLayer) {
        if (localCategories.length > 0) {
          setPendingCopyData(sourceLayer);
          setShowAppendReplaceDialog(true);
          return;
        } else {
          const copiedCategories = sourceLayer.categories.map(cat => ({ ...cat }));
          onUpdate(copiedCategories);
          handleOpen(false);
          
          toast({
            title: "Categories Copied",
            description: `Copied ${copiedCategories.length} categories from "${sourceLayer.name}".`,
          });
          return;
        }
      }
    }
    
    onUpdate(localCategories);
    handleOpen(false);
  };

  const handleAppendReplaceSave = (mode: 'append' | 'replace') => {
    if (!pendingCopyData) return;
    
    const copiedCategories = pendingCopyData.categories.map(cat => ({ ...cat }));
    let finalCategories: Category[];
    
    if (mode === 'append') {
      finalCategories = [...localCategories, ...copiedCategories];
    } else {
      finalCategories = copiedCategories;
    }
    
    onUpdate(finalCategories);
    handleOpen(false);
    setShowAppendReplaceDialog(false);
    setPendingCopyData(null);
    
    const actionText = mode === 'append' ? 'Appended' : 'Copied';
    toast({
      title: `Categories ${actionText}`,
      description: `${actionText} ${copiedCategories.length} categories from "${pendingCopyData.name}".`,
    });
  };

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      <Edit3 className="h-4 w-4 mr-2" />
      Edit Categories ({categories.length})
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {layerName ? `Edit Categories for ${layerName}` : 'Edit Categories'}
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove categories for your legend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <CategoryEditorTabs
              activeTab={activeTab}
              localCategories={localCategories}
              useValues={useValues}
              newCategory={newCategory}
              availableSourceLayers={availableSourceLayers}
              selectedSourceLayer={selectedSourceLayer}
              onActiveTabChange={setActiveTab}
              onSetLocalCategories={setLocalCategories}
              onSetUseValues={setUseValues}
              onSetNewCategory={setNewCategory}
              onSetSelectedSourceLayer={setSelectedSourceLayer}
              onCopyFromLayer={handleCopyFromLayer}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={activeTab === 'copy' && !selectedSourceLayer}
            >
              Save Categories
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CategoryCopyLogic
        availableSourceLayers={availableSourceLayers}
        selectedSourceLayer={selectedSourceLayer}
        localCategories={localCategories}
        useValues={useValues}
        showCopyConfirmation={showCopyConfirmation}
        showAppendReplaceDialog={showAppendReplaceDialog}
        pendingCopyData={pendingCopyData}
        onSetShowCopyConfirmation={setShowCopyConfirmation}
        onSetShowAppendReplaceDialog={setShowAppendReplaceDialog}
        onPerformCopy={performCopy}
        onHandleAppendReplaceSave={handleAppendReplaceSave}
      />
    </>
  );
};

export default CategoryEditorDialog;
