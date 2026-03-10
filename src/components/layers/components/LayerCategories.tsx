
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Tags } from 'lucide-react';
import { Category } from '@/types/config';
import CategoryEditorDialog from '@/components/form/CategoryEditorDialog';

interface LayerCategoriesProps {
  categories: Category[];
  onUpdate?: (categories: Category[]) => void;
  layerName?: string;
}

const LayerCategories = ({ categories, onUpdate, layerName }: LayerCategoriesProps) => {
  if (!categories || categories.length === 0) return null;

  const hasValues = categories.some(cat => cat.value !== undefined);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <h4 className="text-sm font-medium text-muted-foreground">Categories ({categories.length})</h4>
        {onUpdate && (
          <CategoryEditorDialog
            categories={categories}
            onUpdate={onUpdate}
            layerName={layerName}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </div>
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
