
import { useState } from 'react';
import { Category } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
}

interface UseCategoryEditorStateProps {
  categories: Category[];
  availableSourceLayers: AvailableSourceLayer[];
}

export const useCategoryEditorState = ({ categories, availableSourceLayers }: UseCategoryEditorStateProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
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
  const [pendingCopyData, setPendingCopyData] = useState<{ 
    categories: Category[]; 
    hasValues: boolean; 
    name: string 
  } | null>(null);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !activeTab) {
      const defaultTab = localCategories.length === 0 && availableSourceLayers.length > 0 ? "copy" : "manual";
      setActiveTab(defaultTab);
    }
  };

  const handleCancel = () => {
    setLocalCategories([...categories]);
    setUseValues(categories.some(cat => cat.value !== undefined));
    setActiveTab('');
    setSelectedSourceLayer('');
    setOpen(false);
  };

  const performCopy = (sourceLayer: { categories: Category[]; hasValues: boolean; name: string }, mode: 'append' | 'replace') => {
    const copiedCategories = sourceLayer.categories.map(cat => ({ ...cat }));
    
    let finalCategories: Category[];
    if (mode === 'append') {
      finalCategories = [...localCategories, ...copiedCategories];
    } else {
      finalCategories = copiedCategories;
    }
    
    setLocalCategories(finalCategories);
    setUseValues(sourceLayer.hasValues);
    setShowCopyConfirmation(false);
    setShowAppendReplaceDialog(false);
    setPendingCopyData(null);
    setActiveTab('manual');
    
    const actionText = mode === 'append' ? 'Appended' : 'Copied';
    toast({
      title: `Categories ${actionText}`,
      description: `${actionText} ${copiedCategories.length} categories from "${sourceLayer.name}".`,
    });
  };

  return {
    // State
    open,
    activeTab,
    localCategories,
    useValues,
    newCategory,
    showCopyConfirmation,
    showAppendReplaceDialog,
    selectedSourceLayer,
    pendingCopyData,
    
    // State setters
    setActiveTab,
    setLocalCategories,
    setUseValues,
    setNewCategory,
    setShowCopyConfirmation,
    setShowAppendReplaceDialog,
    setSelectedSourceLayer,
    setPendingCopyData,
    
    // Handlers
    handleOpen,
    handleCancel,
    performCopy
  };
};
