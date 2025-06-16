
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Category } from '@/types/config';

interface LayerCategoriesSectionProps {
  categories: Category[];
  onUpdate: (field: string, value: any) => void;
}

const LayerCategoriesSection = ({
  categories,
  onUpdate
}: LayerCategoriesSectionProps) => {
  const [newCategory, setNewCategory] = useState<Category>({ label: '', color: '#000000', value: 0 });
  const [showCategories, setShowCategories] = useState(categories.length > 0);

  const handleAddCategory = () => {
    if (newCategory.label.trim() && newCategory.color.trim()) {
      const categoryWithValue = {
        ...newCategory,
        value: categories.length // Auto-assign value based on current length
      };
      onUpdate('categories', [...categories, categoryWithValue]);
      setNewCategory({ label: '', color: '#000000', value: 0 });
    }
  };

  const handleRemoveCategory = (index: number) => {
    onUpdate('categories', categories.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Categories</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCategories(!showCategories)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Categories
        </Button>
      </div>

      {showCategories && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Category label"
              value={newCategory.label}
              onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-16"
              />
              <Button
                type="button"
                onClick={handleAddCategory}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="space-y-2">
              {categories.map((cat, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.label}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCategory(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LayerCategoriesSection;
