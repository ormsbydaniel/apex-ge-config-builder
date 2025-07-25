import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Category } from '@/types/config';
interface CategoryPreviewProps {
  categories: Category[];
  useValues: boolean;
  className?: string;
}
const CategoryPreview = ({
  categories,
  useValues,
  className = ""
}: CategoryPreviewProps) => {
  if (categories.length === 0) {
    return null;
  }
  return <div className={`space-y-2 p-4 bg-muted/30 rounded-lg ${className}`}>
      
      <div className="flex flex-wrap gap-1">
        {categories.map((category, index) => <Badge key={index} variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{
          backgroundColor: category.color
        }} />
            {category.label || `Category ${index + 1}`}
            {useValues && category.value !== undefined && <span className="text-xs text-muted-foreground ml-1">({category.value})</span>}
          </Badge>)}
      </div>
    </div>;
};
export default CategoryPreview;