
import React, { useCallback } from 'react';
import { Category } from '@/types/config';
import { convertColorToHex } from '@/utils/colorUtils';
import CategoryAddForm from './CategoryAddForm';
import CategoryList from './CategoryList';

interface CategoryManualEditorProps {
  localCategories: Category[];
  setLocalCategories: (categories: Category[]) => void;
  useValues: boolean;
  setUseValues: (useValues: boolean) => void;
  newCategory: Category;
  setNewCategory: (category: Category) => void;
}

const CategoryManualEditor = ({
  localCategories,
  setLocalCategories,
  useValues,
  setUseValues,
  newCategory,
  setNewCategory
}: CategoryManualEditorProps) => {
  // Ensure all categories have proper hex colors when component mounts or categories change
  React.useEffect(() => {
    const normalizedCategories = localCategories.map(cat => ({
      ...cat,
      color: convertColorToHex(cat.color)
    }));
    
    // Only update if colors actually changed to avoid infinite loops
    const hasColorChanges = normalizedCategories.some((cat, index) => 
      cat.color !== localCategories[index]?.color
    );
    
    if (hasColorChanges) {
      setLocalCategories(normalizedCategories);
    }
  }, [localCategories.length]); // Only run when categories are added/removed, not on every change

  const handleAddCategory = () => {
    if (newCategory.label.trim()) {
      // Always assign a value (max existing + 1) so numbering is preserved
      // even if "Use Category Values" is currently off — the user can toggle
      // it back on without losing their numbering.
      const maxValue = localCategories.reduce(
        (max, cat) => (cat.value !== undefined && cat.value > max ? cat.value : max),
        -1,
      );
      const nextValue =
        useValues && newCategory.value !== undefined ? newCategory.value : maxValue + 1;
      const categoryToAdd: Category = {
        color: convertColorToHex(newCategory.color),
        label: newCategory.label,
        value: nextValue,
      };
      setLocalCategories([...localCategories, categoryToAdd]);
      setNewCategory({
        label: '',
        color: '#000000',
        value: useValues ? nextValue + 1 : 0,
      });
    }
  };

  const handleUpdateCategory = useCallback((index: number, field: keyof Category, value: any) => {
    const updated = localCategories.map((cat, i) => {
      if (i === index) {
        if (field === 'value' && !useValues) {
          return cat;
        }
        // Ensure color is converted to hex when updating
        const updatedValue = field === 'color' ? convertColorToHex(value) : value;
        return { ...cat, [field]: updatedValue };
      }
      return cat;
    });
    setLocalCategories(updated);
  }, [localCategories, useValues, setLocalCategories]);

  const handleRemoveCategory = useCallback((index: number) => {
    setLocalCategories(localCategories.filter((_, i) => i !== index));
  }, [localCategories, setLocalCategories]);



  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      <CategoryAddForm
        newCategory={newCategory}
        useValues={useValues}
        onCategoryChange={setNewCategory}
        onAddCategory={handleAddCategory}
      />

      <CategoryList
        categories={localCategories}
        useValues={useValues}
        onUpdateCategory={handleUpdateCategory}
        onRemoveCategory={handleRemoveCategory}
      />
    </div>
  );
};

export default CategoryManualEditor;
