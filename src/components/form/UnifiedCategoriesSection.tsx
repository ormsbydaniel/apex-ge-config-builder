import React from 'react';
import { Category } from '@/types/config';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
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
      <h4 className="font-medium">Categories</h4>
      
      {categories.length > 0 && (
        <CategoryPreview 
          categories={categories} 
          useValues={true}
        />
      )}
      
      <CategoryEditorDialog
        categories={categories}
        onUpdate={handleCategoriesUpdate}
        layerName={layerName}
        trigger={
          <Button type="button" variant="outline" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            {categories.length > 0 ? `Edit Categories (${categories.length})` : "Add Categories"}
          </Button>
        }
      />
    </div>
  );
};

export default UnifiedCategoriesSection;