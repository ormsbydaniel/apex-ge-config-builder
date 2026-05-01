import { useState, useEffect } from 'react';
import { Category } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
}

interface UseCategoryEditorStateProps {
  categories: Category[];
}

const emptyNewCategory = (): Category => ({ label: '', color: '#000000', value: 0 });

export const useCategoryEditorState = ({ categories }: UseCategoryEditorStateProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>([...categories]);
  const [useValues, setUseValues] = useState(categories.some(cat => cat.value !== undefined));
  const [newCategory, setNewCategory] = useState<Category>(emptyNewCategory());
  const [showAppendReplaceDialog, setShowAppendReplaceDialog] = useState(false);
  const [pendingCopyData, setPendingCopyData] = useState<{
    categories: Category[];
    hasValues: boolean;
    name: string;
  } | null>(null);

  // Reset local state every time the dialog opens, so reopens reflect the
  // latest persisted categories rather than a stale first-mount snapshot.
  useEffect(() => {
    if (open) {
      setLocalCategories([...categories]);
      setUseValues(categories.some(cat => cat.value !== undefined));
      setNewCategory(emptyNewCategory());
      setPendingCopyData(null);
      setShowAppendReplaceDialog(false);
    }
    // We deliberately depend only on `open` so external prop churn while the
    // dialog is already open does not blow away in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const performCopy = (
    sourceLayer: { categories: Category[]; hasValues: boolean; name: string },
    mode: 'append' | 'replace',
  ) => {
    const copiedCategories = sourceLayer.categories.map(cat => ({ ...cat }));
    const finalCategories =
      mode === 'append' ? [...localCategories, ...copiedCategories] : copiedCategories;

    setLocalCategories(finalCategories);
    setUseValues(sourceLayer.hasValues);
    setShowAppendReplaceDialog(false);
    setPendingCopyData(null);

    const actionText = mode === 'append' ? 'Appended' : 'Copied';
    toast({
      title: `Categories ${actionText}`,
      description: `${actionText} ${copiedCategories.length} categories from "${sourceLayer.name}".`,
    });
  };

  return {
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
  };
};

export type { AvailableSourceLayer };
