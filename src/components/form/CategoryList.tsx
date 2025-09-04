
import React from 'react';
import { Label } from '@/components/ui/label';
import { Category } from '@/types/config';
import CategoryItem from './CategoryItem';

interface CategoryListProps {
  categories: Category[];
  useValues: boolean;
  onUpdateCategory: (index: number, field: keyof Category, value: any) => void;
  onRemoveCategory: (index: number) => void;
}

const CategoryList = ({ 
  categories, 
  useValues, 
  onUpdateCategory, 
  onRemoveCategory 
}: CategoryListProps) => {
  if (categories.length === 0) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Categories (0)
        </Label>
        <p className="text-sm text-muted-foreground py-8 text-center">
          No categories defined. Add your first category above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Categories ({categories.length})
      </Label>
      
      <div className="bg-muted/20 rounded-lg overflow-hidden">
        {categories.map((category, index) => (
          <CategoryItem
            key={`${category.label}-${category.color}-${category.value}-${index}`}
            category={category}
            index={index}
            useValues={useValues}
            onUpdate={onUpdateCategory}
            onRemove={onRemoveCategory}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
