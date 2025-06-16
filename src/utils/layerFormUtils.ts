
import { DataSource, Category } from '@/types/config';

export const createEmptyLayer = (interfaceGroup?: string): Partial<DataSource> => {
  return {
    name: '',
    isActive: false,
    data: [],
    layout: interfaceGroup ? {
      interfaceGroup
    } : undefined,
    meta: {
      description: '', // Add required description field
      attribution: {
        text: '',
        url: ''
      },
      categories: []
    }
  };
};

export const validateLayerForm = (layer: Partial<DataSource>): string[] => {
  const errors: string[] = [];
  
  if (!layer.name?.trim()) {
    errors.push('Layer name is required');
  }
  
  if (!layer.data || layer.data.length === 0) {
    errors.push('Layer data is required');
  }
  
  return errors;
};

export const addCategoryToLayer = (
  layer: DataSource,
  category: Category
): DataSource => {
  return {
    ...layer,
    meta: {
      ...layer.meta,
      description: layer.meta?.description || '', // Ensure description is preserved
      attribution: layer.meta?.attribution || { text: '', url: '' },
      categories: [...(layer.meta?.categories || []), category]
    }
  };
};

export const removeCategoryFromLayer = (
  layer: DataSource,
  categoryIndex: number
): DataSource => {
  return {
    ...layer,
    meta: {
      ...layer.meta,
      description: layer.meta?.description || '', // Ensure description is preserved
      attribution: layer.meta?.attribution || { text: '', url: '' },
      categories: (layer.meta?.categories || []).filter((_, index) => index !== categoryIndex)
    }
  };
};
