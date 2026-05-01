import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/config';

interface CategoryBadgeListProps {
  categories: Category[];
  useValues: boolean;
  className?: string;
}

/**
 * Renders a wrapping list of category badges (color dot + label, optional value).
 * Shared between the editor preview and the copy-confirmation dialog so the
 * visual style stays in one place.
 */
export const CategoryBadgeList = ({
  categories,
  useValues,
  className = '',
}: CategoryBadgeListProps) => (
  <div className={`flex flex-wrap gap-1 ${className}`}>
    {categories.map((category, index) => (
      <Badge
        key={`${category.color}-${category.label || `cat-${index}`}-${category.value}`}
        variant="outline"
        className="flex items-center gap-1"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        {category.label || `Category ${index + 1}`}
        {useValues && category.value !== undefined && (
          <span className="text-xs text-muted-foreground ml-1">({category.value})</span>
        )}
      </Badge>
    ))}
  </div>
);

interface CategoryPreviewProps {
  categories: Category[];
  useValues: boolean;
  className?: string;
}

const CategoryPreview = ({
  categories,
  useValues,
  className = '',
}: CategoryPreviewProps) => {
  if (categories.length === 0) {
    return null;
  }
  return (
    <div className={`pr-4 py-1 bg-muted/30 rounded-lg ${className}`}>
      <CategoryBadgeList
        categories={categories}
        useValues={useValues}
        className="max-h-[8.4rem] overflow-y-auto pr-1"
      />
    </div>
  );
};

export default CategoryPreview;
