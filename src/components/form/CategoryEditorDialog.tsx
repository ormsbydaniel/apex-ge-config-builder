import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { Category } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';
import { useCategoryEditorState } from '@/hooks/useCategoryEditorState';
import { normalizeCategories } from '@/utils/categoryValidation';
import { CategoryCsvParseResult } from '@/utils/categoryCsv';
import CategoryManualEditor from './CategoryManualEditor';
import CategoryCopyLogic from './CategoryCopyLogic';
import CategoryCopyFromLayerButton, { AvailableSourceLayer } from './CategoryCopyFromLayerButton';
import CategoryCsvActions from './CategoryCsvActions';
import CategoryPreview from './CategoryPreview';

interface CategoryEditorDialogProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
  trigger?: React.ReactNode;
  layerName?: string;
}

const CategoryEditorDialog = ({
  categories,
  onUpdate,
  trigger,
  layerName,
}: CategoryEditorDialogProps) => {
  const { config } = useConfig();
  const { toast } = useToast();
  const [importErrors, setImportErrors] = React.useState<{ row: number; message: string }[]>([]);

  const availableSourceLayers: AvailableSourceLayer[] = config.sources
    .filter(source => {
      if (layerName && source.name === layerName) return false;
      return source.meta?.categories && source.meta.categories.length > 0;
    })
    .map(source => {
      const sourceCategories = (source.meta?.categories || []).map((cat, index) => ({
        label: cat.label || `Category ${index + 1}`,
        color: cat.color || '#000000',
        value: cat.value !== undefined ? cat.value : index,
      }));
      const normalizedCategories = normalizeCategories(sourceCategories);
      return {
        name: source.name || 'Unnamed Layer',
        categories: normalizedCategories,
        hasValues: normalizedCategories.some(cat => cat.value !== undefined),
      };
    });

  const {
    open,
    localCategories,
    useValues,
    newCategory,
    showAppendReplaceDialog,
    pendingCopyData,
    setLocalCategories,
    setUseValues,
    setNewCategory,
    setShowAppendReplaceDialog,
    setPendingCopyData,
    handleOpen,
    handleCancel,
    performCopy,
  } = useCategoryEditorState({ categories });

  const handleSave = () => {
    onUpdate(localCategories);
    handleOpen(false);
  };

  const handleCopy = (sourceLayer: AvailableSourceLayer, mode: 'append' | 'replace') => {
    performCopy(sourceLayer, mode);
  };

  const handleRequestAppendReplace = (sourceLayer: AvailableSourceLayer) => {
    setPendingCopyData(sourceLayer);
    setShowAppendReplaceDialog(true);
  };

  const handleAppendReplaceChoose = (mode: 'append' | 'replace') => {
    if (pendingCopyData) {
      performCopy(pendingCopyData, mode);
    }
  };

  const handleCsvImport = (result: CategoryCsvParseResult) => {
    if (result.errors.length > 0) {
      setImportErrors(result.errors);
      toast({
        title: 'CSV import failed',
        description: `${result.errors.length} row${result.errors.length === 1 ? '' : 's'} had errors. See details in the editor.`,
        variant: 'destructive',
      });
      return;
    }
    setImportErrors([]);

    const importedSource = {
      name: 'CSV file',
      categories: result.categories,
      hasValues: result.useValues,
    };

    if (localCategories.length > 0) {
      setPendingCopyData(importedSource);
      setShowAppendReplaceDialog(true);
      return;
    }

    setLocalCategories(result.categories);
    setUseValues(result.useValues);
    toast({
      title: 'Categories imported',
      description: `Imported ${result.categories.length} categories from CSV${
        result.useValues !== useValues
          ? ` (switched values mode ${result.useValues ? 'on' : 'off'})`
          : ''
      }.`,
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
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {layerName ? `Edit Categories for ${layerName}` : 'Edit Categories'}
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove categories for your legend.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
            <CategoryCopyFromLayerButton
              availableSourceLayers={availableSourceLayers}
              hasExistingCategories={localCategories.length > 0}
              onCopy={handleCopy}
              onRequestAppendReplace={handleRequestAppendReplace}
            />
            <CategoryCsvActions
              categories={localCategories}
              useValues={useValues}
              filenameBase={layerName || 'categories'}
              onImport={handleCsvImport}
            />
          </div>

          {importErrors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <p className="font-medium text-destructive mb-1">
                CSV import errors ({importErrors.length}):
              </p>
              <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                {importErrors.slice(0, 10).map((err, i) => (
                  <li key={i} className="text-muted-foreground">
                    Row {err.row}: {err.message}
                  </li>
                ))}
                {importErrors.length > 10 && (
                  <li className="text-muted-foreground italic">
                    …and {importErrors.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <CategoryManualEditor
              localCategories={localCategories}
              setLocalCategories={setLocalCategories}
              useValues={useValues}
              setUseValues={setUseValues}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
            />
          </div>

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

      <CategoryCopyLogic
        open={showAppendReplaceDialog}
        localCategoriesCount={localCategories.length}
        pendingCopyData={pendingCopyData}
        onOpenChange={setShowAppendReplaceDialog}
        onChoose={handleAppendReplaceChoose}
      />
    </>
  );
};

export default CategoryEditorDialog;
