
import React from 'react';
import { Category } from '@/types/config';
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
  const handleAddCategory = () => {
    if (newCategory.label.trim()) {
      const categoryToAdd: Category = {
        color: newCategory.color,
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

  const handleUpdateCategory = (index: number, field: keyof Category, value: any) => {
    const updated = localCategories.map((cat, i) => {
      if (i === index) {
        if (field === 'value' && !useValues) {
          return cat;
        }
        return { ...cat, [field]: value };
      }
      return cat;
    });
    setLocalCategories(updated);
  };

  const handleRemoveCategory = (index: number) => {
    setLocalCategories(localCategories.filter((_, i) => i !== index));
  };

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
