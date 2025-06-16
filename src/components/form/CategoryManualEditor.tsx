
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';
import { Category } from '@/types/config';
import CategoryPreview from './CategoryPreview';

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
  const addCategory = () => {
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

  const updateCategory = (index: number, field: keyof Category, value: any) => {
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

  const removeCategory = (index: number) => {
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
      {/* Use Values Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Use Category Values</Label>
          <p className="text-xs text-muted-foreground">
            Enable numeric values for categories (useful for statistics and data mapping)
          </p>
        </div>
        <Switch
          checked={useValues}
          onCheckedChange={handleUseValuesToggle}
        />
      </div>

      {/* Add New Category */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
        <Label className="text-sm font-medium">Add New Category</Label>
        <div className="flex gap-3">
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            className="w-12 h-10 rounded border cursor-pointer"
            title="Category color"
          />
          <Input
            value={newCategory.label}
            onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
            placeholder="Category label"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          {useValues && (
            <Input
              type="number"
              value={newCategory.value !== undefined ? newCategory.value : ''}
              onChange={(e) => setNewCategory({ 
                ...newCategory, 
                value: e.target.value ? parseInt(e.target.value) : 0 
              })}
              placeholder="Value"
              className="w-20"
            />
          )}
          <Button type="button" onClick={addCategory} disabled={!newCategory.label.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Existing Categories - Compact Table Style */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Categories ({localCategories.length})
        </Label>
        
        {localCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No categories defined. Add your first category above.
          </p>
        ) : (
          <div className="bg-muted/20 rounded-lg overflow-hidden">
            {localCategories.map((category, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 px-3 py-2 ${
                  index % 2 === 0 ? 'bg-background/50' : 'bg-transparent'
                } hover:bg-muted/50 transition-colors`}
              >
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => updateCategory(index, 'color', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                  title="Category color"
                />
                
                <Input
                  value={category.label}
                  onChange={(e) => updateCategory(index, 'label', e.target.value)}
                  placeholder="Category label"
                  className="flex-1 h-8 text-sm"
                />
                
                {useValues && (
                  <Input
                    type="number"
                    value={category.value !== undefined ? category.value : ''}
                    onChange={(e) => updateCategory(index, 'value', e.target.value ? parseInt(e.target.value) : 0)}
                    placeholder="Value"
                    className="w-16 h-8 text-sm"
                  />
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCategory(index)}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <CategoryPreview 
        categories={localCategories} 
        useValues={useValues} 
      />
    </div>
  );
};

export default CategoryManualEditor;
