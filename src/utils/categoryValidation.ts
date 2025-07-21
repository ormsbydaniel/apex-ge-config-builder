
import { Category } from '@/types/config';

export const validateCategoryData = (categories: Category[]): boolean => {
  return categories.every(category => 
    category.label && 
    category.label.trim().length > 0 &&
    category.color &&
    category.value !== undefined
  );
};

export const normalizeCategoryValue = (category: Category, index: number): Category => {
  return {
    ...category,
    label: category.label || `Category ${index + 1}`,
    color: category.color || '#000000',
    value: category.value !== undefined ? category.value : index
  };
};

export const normalizeCategories = (categories: Category[]): Category[] => {
  return categories.map((cat, index) => normalizeCategoryValue(cat, index));
};
