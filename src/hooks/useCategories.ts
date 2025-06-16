
import { useState } from 'react';
import { Category, DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

export const useCategories = (
  formData: DataSource,
  updateFormData: (path: string, value: any) => void
) => {
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState<Category>({ color: '#000000', label: '', value: 0 });
  const [showCategories, setShowCategories] = useState(false);

  const addCategory = () => {
    if (newCategory.label.trim() && newCategory.color) {
      const categoryWithValue = {
        ...newCategory,
        value: (formData.meta?.categories?.length || 0) // Auto-assign value based on current length
      };
      updateFormData('meta.categories', [...(formData.meta?.categories || []), categoryWithValue]);
      setNewCategory({ color: '#000000', label: '', value: 0 });
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
