import React from 'react';
import { Category } from '@/types/config';
import CategoryEditorDialog from './CategoryEditorDialog';
import CategoryPreview from './CategoryPreview';

interface UnifiedCategoriesSectionProps {
  categories: Category[];
  onUpdate: (field: string, value: any) => void;
  layerName: string;
}

const UnifiedCategoriesSection = ({
  categories,
  onUpdate,
  layerName
}: UnifiedCategoriesSectionProps) => {
  const handleCategoriesUpdate = (updatedCategories: Category[]) => {
    onUpdate('categories', updatedCategories);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Categories</h4>
        <CategoryEditorDialog
          categories={categories}
          onUpdate={handleCategoriesUpdate}
          layerName={layerName}
        />
      </div>
      
      {categories.length > 0 && (
        <CategoryPreview 
          categories={categories} 
          useValues={true}
        />
      )}
    </div>
  );
};

export default UnifiedCategoriesSection;