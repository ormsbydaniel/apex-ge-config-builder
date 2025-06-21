
import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface UseTableSortingProps<T, K extends keyof T> {
  data: T[];
  defaultSortField: K;
  defaultSortDirection?: SortDirection;
}

export const useTableSorting = <T, K extends keyof T>({
  data,
  defaultSortField,
  defaultSortDirection = 'asc'
}: UseTableSortingProps<T, K>) => {
  const [sortField, setSortField] = useState<K>(defaultSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Special handling for nested properties like layer.name
      if (sortField === 'layer' && typeof a === 'object' && a !== null && 'layer' in a) {
        aValue = (a as any).layer.name as T[K];
        bValue = (b as any).layer.name as T[K];
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase() as T[K];
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase() as T[K];
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: K) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort
  };
};
