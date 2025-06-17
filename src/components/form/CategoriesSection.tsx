
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { DataSource, Category } from '@/types/config';

interface CategoriesSectionProps {
  formData: DataSource;
  newCategory: Category;
  showCategories: boolean;
  onSetNewCategory: (category: Category) => void;
  onSetShowCategories: (show: boolean) => void;
  onAddCategory: () => void;
  onRemoveCategory: (index: number) => void;
}

const CategoriesSection = ({
  formData,
  newCategory,
  showCategories,
  onSetNewCategory,
  onSetShowCategories,
  onAddCategory,
  onRemoveCategory
}: CategoriesSectionProps) => {
  const hasValues = formData.meta?.categories?.some(cat => cat.value !== undefined) || false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Categories (Optional)</h3>
        <Switch
          checked={showCategories}
          onCheckedChange={onSetShowCategories}
        />
      </div>
      
      {showCategories && (
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
          <p className="text-sm text-slate-600">
            Define categories for automatic legend generation and statistics
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={newCategory.label}
                onChange={(e) => onSetNewCategory({ ...newCategory, label: e.target.value })}
                placeholder="Category label"
              />
            </div>
            <div className="w-20">
              <Input
                type="color"
                value={newCategory.color}
                onChange={(e) => onSetNewCategory({ ...newCategory, color: e.target.value })}
              />
            </div>
            {hasValues && (
              <div className="w-20">
                <Input
                  type="number"
                  value={newCategory.value !== undefined ? newCategory.value : ''}
                  onChange={(e) => onSetNewCategory({ 
                    ...newCategory, 
                    value: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Value"
                />
              </div>
            )}
            <Button type="button" onClick={onAddCategory} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.meta?.categories?.map((category, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.label}
                {hasValues && category.value !== undefined && (
                  <span className="text-xs text-muted-foreground">({category.value})</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveCategory(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesSection;
