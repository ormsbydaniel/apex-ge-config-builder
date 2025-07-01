
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/config';

interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
}

interface CategoryCopyLogicProps {
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  localCategories: Category[];
  useValues: boolean;
  showCopyConfirmation: boolean;
  showAppendReplaceDialog: boolean;
  pendingCopyData: { categories: Category[]; hasValues: boolean; name: string } | null;
  onSetShowCopyConfirmation: (show: boolean) => void;
  onSetShowAppendReplaceDialog: (show: boolean) => void;
  onPerformCopy: (sourceLayer: { categories: Category[]; hasValues: boolean; name: string }, mode: 'append' | 'replace') => void;
  onHandleAppendReplaceSave: (mode: 'append' | 'replace') => void;
}

const CategoryCopyLogic = ({
  availableSourceLayers,
  selectedSourceLayer,
  localCategories,
  useValues,
  showCopyConfirmation,
  showAppendReplaceDialog,
  pendingCopyData,
  onSetShowCopyConfirmation,
  onSetShowAppendReplaceDialog,
  onPerformCopy,
  onHandleAppendReplaceSave
}: CategoryCopyLogicProps) => {
  const selectedSourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);

  return (
    <>
      {/* Append/Replace Dialog */}
      <AlertDialog open={showAppendReplaceDialog} onOpenChange={onSetShowAppendReplaceDialog}>
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
              onClick={() => onHandleAppendReplaceSave('append')}
            >
              Append ({localCategories.length + (pendingCopyData?.categories.length || 0)} total)
            </Button>
            <AlertDialogAction 
              onClick={() => onHandleAppendReplaceSave('replace')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace ({pendingCopyData?.categories.length} total)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legacy Copy Confirmation Dialog */}
      <AlertDialog open={showCopyConfirmation} onOpenChange={onSetShowCopyConfirmation}>
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
              onClick={() => selectedSourceLayerData && onPerformCopy(selectedSourceLayerData, 'replace')}
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

export default CategoryCopyLogic;
