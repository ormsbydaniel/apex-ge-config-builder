
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/config';

interface LayerCategoriesProps {
  categories: Category[];
}

const LayerCategories = ({ categories }: LayerCategoriesProps) => {
  if (!categories || categories.length === 0) return null;

  const hasValues = categories.some(cat => cat.value !== undefined);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Categories</h4>
      <div className="flex flex-wrap gap-1">
        {categories.map((cat, catIndex) => (
          <Badge key={catIndex} variant="outline" className="text-xs border-primary/30">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: cat.color }}
            />
            {cat.label}
            {hasValues && cat.value !== undefined && (
              <span className="text-xs text-muted-foreground ml-1">({cat.value})</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default LayerCategories;
