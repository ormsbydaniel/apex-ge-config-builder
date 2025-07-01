
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { Category } from '@/types/config';
import { convertColorToHex } from '@/utils/colorUtils';

interface CategoryItemProps {
  category: Category;
  index: number;
  useValues: boolean;
  onUpdate: (index: number, field: keyof Category, value: any) => void;
  onRemove: (index: number) => void;
}

const CategoryItem = ({ 
  category, 
  index, 
  useValues, 
  onUpdate, 
  onRemove 
}: CategoryItemProps) => {
  const isEvenRow = index % 2 === 0;
  
  // Ensure color is in hex format for the color picker
  const displayColor = convertColorToHex(category.color);

  return (
    <div 
      className={`flex items-center gap-3 px-3 py-2 ${
        isEvenRow ? 'bg-background/50' : 'bg-transparent'
      } hover:bg-muted/50 transition-colors`}
    >
      <input
        type="color"
        value={displayColor}
        onChange={(e) => onUpdate(index, 'color', e.target.value)}
        className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
        title="Category color"
      />
      
      <Input
        value={category.label}
        onChange={(e) => onUpdate(index, 'label', e.target.value)}
        placeholder="Category label"
        className="flex-1 h-8 text-sm"
      />
      
      {useValues && (
        <Input
          type="number"
          value={category.value !== undefined ? category.value : ''}
          onChange={(e) => onUpdate(index, 'value', e.target.value ? parseInt(e.target.value) : 0)}
          placeholder="Value"
          className="w-16 h-8 text-sm"
        />
      )}
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CategoryItem;
