import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Edit3 } from 'lucide-react';
import { Category } from '@/types/config';

interface CategoryEditorDialogProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
  trigger?: React.ReactNode;
}

const CategoryEditorDialog = ({ categories, onUpdate, trigger }: CategoryEditorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newCategory, setNewCategory] = useState<Category>({
    label: '',
    color: '#000000',
    value: 0
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalCategories([...categories]);
    }
    setOpen(isOpen);
  };

  const addCategory = () => {
    if (newCategory.label.trim()) {
      const categoryToAdd = {
        ...newCategory,
        value: localCategories.length
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
    const updated = localCategories.map((cat, i) => 
      i === index ? { ...cat, [field]: value } : cat
    );
    setLocalCategories(updated);
  };

  const removeCategory = (index: number) => {
    setLocalCategories(localCategories.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdate(localCategories);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalCategories([...categories]);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      <Edit3 className="h-4 w-4 mr-2" />
      Edit Categories ({categories.length})
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or remove categories for your legend.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Add New Category */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm font-medium">Add New Category</Label>
            <div className="flex gap-3">
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 rounded border cursor-pointer"
                title="Category color"
              />
              <Input
                value={newCategory.label}
                onChange={(e) => setNewCategory(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Category label"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button type="button" onClick={addCategory} disabled={!newCategory.label.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Categories ({localCategories.length})
            </Label>
            
            {localCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No categories defined. Add your first category above.
              </p>
            ) : (
              <div className="space-y-2">
                {localCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) => updateCategory(index, 'color', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                      title="Category color"
                    />
                    
                    <Input
                      value={category.label}
                      onChange={(e) => updateCategory(index, 'label', e.target.value)}
                      placeholder="Category label"
                      className="flex-1"
                    />
                    
                    <Input
                      type="number"
                      value={category.value}
                      onChange={(e) => updateCategory(index, 'value', parseInt(e.target.value) || 0)}
                      placeholder="Value"
                      className="w-20"
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {localCategories.length > 0 && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex flex-wrap gap-1">
                {localCategories.map((category, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.label || `Category ${index + 1}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Categories
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryEditorDialog;
