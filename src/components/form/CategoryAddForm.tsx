
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Category } from '@/types/config';

interface CategoryAddFormProps {
  newCategory: Category;
  useValues: boolean;
  onCategoryChange: (category: Category) => void;
  onAddCategory: () => void;
}

const CategoryAddForm = ({ 
  newCategory, 
  useValues, 
  onCategoryChange, 
  onAddCategory 
}: CategoryAddFormProps) => {
  const handleColorChange = (color: string) => {
    onCategoryChange({ ...newCategory, color });
  };

  const handleLabelChange = (label: string) => {
    onCategoryChange({ ...newCategory, label });
  };

  const handleValueChange = (value: number) => {
    onCategoryChange({ ...newCategory, value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddCategory();
    }
  };

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
      <Label className="text-sm font-medium">Add New Category</Label>
      <div className="flex gap-3">
        <input
          type="color"
          value={newCategory.color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-12 h-10 rounded border cursor-pointer"
          title="Category color"
        />
        <Input
          value={newCategory.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Category label"
          className="flex-1"
          onKeyDown={handleKeyDown}
        />
        {useValues && (
          <Input
            type="number"
            value={newCategory.value !== undefined ? newCategory.value : ''}
            onChange={(e) => handleValueChange(e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="Value"
            className="w-20"
          />
        )}
        <Button type="button" onClick={onAddCategory} disabled={!newCategory.label.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CategoryAddForm;
