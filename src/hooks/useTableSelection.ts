
import { useState, useCallback } from 'react';

interface UseTableSelectionProps<T> {
  items: T[];
  getItemKey: (item: T) => string;
}

export const useTableSelection = <T>({ items, getItemKey }: UseTableSelectionProps<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleItemSelection = useCallback((itemKey: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemKey);
    } else {
      newSelected.delete(itemKey);
    }
    setSelectedItems(newSelected);
  }, [selectedItems]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allKeys = new Set(items.map(getItemKey));
      setSelectedItems(allKeys);
    } else {
      setSelectedItems(new Set());
    }
  }, [items, getItemKey]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < items.length;

  return {
    selectedItems,
    handleItemSelection,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isPartiallySelected
  };
};
