
import { useState } from 'react';
import { Category, DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

export const useCategories = (
  formData: DataSource,
  updateFormData: (path: string, value: any) => void
) => {
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState<Category>({ 
    color: '#000000', 
    label: '', 
    value: undefined // Initialize with undefined instead of 0
  });
  const [showCategories, setShowCategories] = useState(false);

  const addCategory = () => {
    if (newCategory.label.trim() && newCategory.color) {
      // Only include value if it's been set (not undefined)
      const categoryToAdd: Category = {
        color: newCategory.color,
        label: newCategory.label,
        ...(newCategory.value !== undefined && { value: newCategory.value })
      };
      
      updateFormData('meta.categories', [...(formData.meta?.categories || []), categoryToAdd]);
      setNewCategory({ color: '#000000', label: '', value: undefined });
      toast({
        title: "Category Added",
        description: `"${newCategory.label}" has been added to categories.`,
      });
    }
  };

  const removeCategory = (index: number) => {
    const updatedCategories = formData.meta?.categories?.filter((_, i) => i !== index) || [];
    updateFormData('meta.categories', updatedCategories);
  };

  return {
    newCategory,
    setNewCategory,
    showCategories,
    setShowCategories,
    addCategory,
    removeCategory
  };
};

