
import React, { useCallback } from 'react';
import { Category } from '@/types/config';
import { convertColorToHex } from '@/utils/colorUtils';
import CategoryPreview from './CategoryPreview';
import CategoryValueToggle from './CategoryValueToggle';
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
      const categoryToAdd: Category = {
        color: convertColorToHex(newCategory.color),
        label: newCategory.label,
        value: useValues ? (newCategory.value !== undefined ? newCategory.value : localCategories.length) : localCategories.length
      };
      setLocalCategories([...localCategories, categoryToAdd]);
      setNewCategory({
        label: '',
        color: '#000000',
        value: 0
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

  const handleUseValuesToggle = (checked: boolean) => {
    setUseValues(checked);
    if (checked) {
      const updatedCategories = localCategories.map((cat, index) => ({
        ...cat,
        value: cat.value !== undefined ? cat.value : index
      }));
      setLocalCategories(updatedCategories);
      if (newCategory.value === undefined) {
        setNewCategory({ ...newCategory, value: localCategories.length });
      }
    } else {
      const updatedCategories = localCategories.map((cat, index) => ({
        ...cat,
        value: index
      }));
      setLocalCategories(updatedCategories);
      setNewCategory({ ...newCategory, value: 0 });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <CategoryValueToggle 
        useValues={useValues}
        onToggle={handleUseValuesToggle}
      />

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

      <CategoryPreview 
        categories={localCategories} 
        useValues={useValues} 
      />
    </div>
  );
};

export default CategoryManualEditor;
