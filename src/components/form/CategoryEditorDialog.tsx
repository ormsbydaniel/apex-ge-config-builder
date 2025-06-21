
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit3 } from 'lucide-react';
import { Category } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';
import CategoryManualEditor from './CategoryManualEditor';
import CategoryCopyFromLayer from './CategoryCopyFromLayer';

interface CategoryEditorDialogProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
  trigger?: React.ReactNode;
  layerName?: string;
}

const CategoryEditorDialog = ({ categories, onUpdate, trigger, layerName }: CategoryEditorDialogProps) => {
  const { config } = useConfig();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Initialize localCategories with the provided categories at component creation
  const [localCategories, setLocalCategories] = useState<Category[]>([...categories]);
  const [useValues, setUseValues] = useState(categories.some(cat => cat.value !== undefined));
  const [newCategory, setNewCategory] = useState<Category>({
    label: '',
    color: '#000000',
    value: 0
  });
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [showAppendReplaceDialog, setShowAppendReplaceDialog] = useState(false);
  const [selectedSourceLayer, setSelectedSourceLayer] = useState<string>('');
  const [pendingCopyData, setPendingCopyData] = useState<{ categories: Category[]; hasValues: boolean; name: string } | null>(null);

  // Simple handleOpen that controls dialog visibility and sets default tab
  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !activeTab) {
      // Determine default tab based on context
      const defaultTab = localCategories.length === 0 && availableSourceLayers.length > 0 ? "copy" : "manual";
      setActiveTab(defaultTab);
    }
  };

  // Get available layers with categories for copying
  const availableSourceLayers = config.sources
    .filter(source => source.meta?.categories && source.meta.categories.length > 0)
    .map(source => {
      // Ensure categories have proper defaults for required properties
      const normalizedCategories: Category[] = (source.meta?.categories || []).map((cat, index) => ({
        label: cat.label || `Category ${index + 1}`,
        color: cat.color || '#000000',
        value: cat.value !== undefined ? cat.value : index
      }));

      return {
        name: source.name || 'Unnamed Layer',
        categories: normalizedCategories,
        hasValues: normalizedCategories.some(cat => cat.value !== undefined)
      };
    });

  const handleCopyFromLayer = () => {
    if (!selectedSourceLayer) return;
    
    const sourceLayer = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);
    if (!sourceLayer) return;

    // Check if we have existing categories
    if (localCategories.length > 0) {
      setPendingCopyData(sourceLayer);
      setShowAppendReplaceDialog(true);
    } else {
      performCopy(sourceLayer, 'replace');
    }
  };

  const performCopy = (sourceLayer: { categories: Category[]; hasValues: boolean; name: string }, mode: 'append' | 'replace') => {
    // Deep copy categories to avoid reference issues
    const copiedCategories = sourceLayer.categories.map(cat => ({ ...cat }));
    
    let finalCategories: Category[];
    if (mode === 'append') {
      // Append to existing categories
      finalCategories = [...localCategories, ...copiedCategories];
    } else {
      // Replace existing categories
      finalCategories = copiedCategories;
    }
    
    setLocalCategories(finalCategories);
    setUseValues(sourceLayer.hasValues);
    setShowCopyConfirmation(false);
    setShowAppendReplaceDialog(false);
    setPendingCopyData(null);
    
    // Switch to manual tab to show the updated categories
    setActiveTab('manual');
    
    const actionText = mode === 'append' ? 'Appended' : 'Copied';
    toast({
      title: `Categories ${actionText}`,
      description: `${actionText} ${copiedCategories.length} categories from "${sourceLayer.name}".`,
    });
  };

  const handleSave = () => {
    onUpdate(localCategories);
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset to original state only when explicitly canceling
    setLocalCategories([...categories]);
    setUseValues(categories.some(cat => cat.value !== undefined));
    setActiveTab('');
    setOpen(false);
  };

  const selectedSourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  Manual Editor
                  <Badge variant="secondary" className="text-xs">
                    {localCategories.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="copy" 
                  disabled={availableSourceLayers.length === 0}
                  className="flex items-center gap-2"
                >
                  Copy from Layer
                  <Badge variant="secondary" className="text-xs">
                    {availableSourceLayers.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <CategoryManualEditor
                  key={`manual-editor-${localCategories.length}-${localCategories.map(c => c.label).join('-')}`}
                  localCategories={localCategories}
                  setLocalCategories={setLocalCategories}
                  useValues={useValues}
                  setUseValues={setUseValues}
                  newCategory={newCategory}
                  setNewCategory={setNewCategory}
                />
              </TabsContent>

              <TabsContent value="copy">
                <CategoryCopyFromLayer
                  availableSourceLayers={availableSourceLayers}
                  selectedSourceLayer={selectedSourceLayer}
                  setSelectedSourceLayer={setSelectedSourceLayer}
                  onCopyFromLayer={handleCopyFromLayer}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Categories
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Append/Replace Dialog */}
      <AlertDialog open={showAppendReplaceDialog} onOpenChange={setShowAppendReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Categories</AlertDialogTitle>
            <AlertDialogDescription>
              You have {localCategories.length} existing categories. How would you like to add the {pendingCopyData?.categories.length} categories from "{pendingCopyData?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              variant="outline"
              onClick={() => pendingCopyData && performCopy(pendingCopyData, 'append')}
            >
              Append ({localCategories.length + (pendingCopyData?.categories.length || 0)} total)
            </Button>
            <AlertDialogAction 
              onClick={() => pendingCopyData && performCopy(pendingCopyData, 'replace')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace ({pendingCopyData?.categories.length} total)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legacy Copy Confirmation Dialog (kept for backward compatibility) */}
      <AlertDialog open={showCopyConfirmation} onOpenChange={setShowCopyConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Existing Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current {localCategories.length} categories with {selectedSourceLayerData?.categories.length} categories from "{selectedSourceLayer}".
              {selectedSourceLayerData?.hasValues !== useValues && (
                <span className="block mt-2 text-amber-600">
                  Note: The value settings will also change to match the source layer.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedSourceLayerData && performCopy(selectedSourceLayerData, 'replace')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryEditorDialog;
