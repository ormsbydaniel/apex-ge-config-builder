
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/config';

interface LayerCategoriesProps {
  categories: Category[];
}

const LayerCategories = ({ categories }: LayerCategoriesProps) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="mt-3">
      <span className="text-sm font-medium text-slate-600">Categories:</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {categories.map((cat, catIndex) => (
          <Badge key={catIndex} variant="outline" className="text-xs border-primary/30">
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: cat.color }}
            />
            {cat.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default LayerCategories;
