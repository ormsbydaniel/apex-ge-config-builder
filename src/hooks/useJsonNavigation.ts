import { useState, useCallback } from 'react';

export const useJsonNavigation = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const updatePath = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setMatchCount(0);
  }, []);

  const updateMatchCount = useCallback((count: number) => {
    setMatchCount(count);
  }, []);

  return {
    currentPath,
    searchQuery,
    matchCount,
    updatePath,
    updateSearch,
    clearSearch,
    updateMatchCount,
  };
};
