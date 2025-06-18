
import { useState, useCallback, useRef } from 'react';

interface UseTableSelectionProps<T> {
  items: T[];
  getItemKey: (item: T) => string;
}

export const useTableSelection = <T>({ items, getItemKey }: UseTableSelectionProps<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const lastSelectedIndexRef = useRef<number | null>(null);

  const handleItemSelection = useCallback((itemKey: string, checked: boolean, shiftKey: boolean = false) => {
    const currentIndex = items.findIndex(item => getItemKey(item) === itemKey);
    
    if (shiftKey && lastSelectedIndexRef.current !== null) {
      // Handle range selection
      const startIndex = Math.min(lastSelectedIndexRef.current, currentIndex);
      const endIndex = Math.max(lastSelectedIndexRef.current, currentIndex);
      
      const newSelected = new Set(selectedItems);
      
      // Apply the same action (check/uncheck) to all items in the range
      for (let i = startIndex; i <= endIndex; i++) {
        const key = getItemKey(items[i]);
        if (checked) {
          newSelected.add(key);
        } else {
          newSelected.delete(key);
        }
      }
      
      setSelectedItems(newSelected);
    } else {
      // Handle single selection
      const newSelected = new Set(selectedItems);
      if (checked) {
        newSelected.add(itemKey);
      } else {
        newSelected.delete(itemKey);
      }
      setSelectedItems(newSelected);
    }
    
    // Update last selected index for future range selections
    lastSelectedIndexRef.current = currentIndex;
  }, [selectedItems, items, getItemKey]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allKeys = new Set(items.map(getItemKey));
      setSelectedItems(allKeys);
    } else {
      setSelectedItems(new Set());
    }
    // Reset last selected index when doing select all
    lastSelectedIndexRef.current = null;
  }, [items, getItemKey]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    lastSelectedIndexRef.current = null;
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
