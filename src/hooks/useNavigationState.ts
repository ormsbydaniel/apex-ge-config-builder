import { useState, useEffect, useCallback } from 'react';
import { readStored, removeStored, writeStored } from '@/utils/browserStorage';

/**
 * Hook for persisting navigation state across Preview <-> Config Builder transitions
 */

export interface NavigationState {
  activeTab: string;
  expandedGroups: string[];
  expandedLayers: string[];
  expandedSubGroups: string[];
  scrollPosition: number;
}

const STORAGE_KEY = 'configBuilder:navigationState';

const defaultState: NavigationState = {
  activeTab: 'home',
  expandedGroups: [],
  expandedLayers: [],
  expandedSubGroups: [],
  scrollPosition: 0
};

export const useNavigationState = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Try to load from sessionStorage on mount
    try {
      const saved = readStored(sessionStorage, STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load navigation state:', error);
    }
    return defaultState;
  });

  // Save to sessionStorage whenever state changes
  const saveState = useCallback((newState: NavigationState) => {
    try {
      writeStored(sessionStorage, STORAGE_KEY, JSON.stringify(newState));
      setNavigationState(newState);
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, []); // Remove navigationState dependency

  // Update individual pieces of state
  const setActiveTab = useCallback((tab: string) => {
    setNavigationState(prev => {
      const newState = { ...prev, activeTab: tab };
      try {
        writeStored(sessionStorage, STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
      return newState;
    });
  }, []);

  const setExpandedGroups = useCallback((groups: string[]) => {
    setNavigationState(prev => {
      const newState = { ...prev, expandedGroups: groups };
      try {
        writeStored(sessionStorage, STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
      return newState;
    });
  }, []);

  const setExpandedLayers = useCallback((layers: string[]) => {
    setNavigationState(prev => {
      const newState = { ...prev, expandedLayers: layers };
      try {
        writeStored(sessionStorage, STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
      return newState;
    });
  }, []);

  const setScrollPosition = useCallback((position: number) => {
    setNavigationState(prev => {
      const newState = { ...prev, scrollPosition: position };
      try {
        writeStored(sessionStorage, STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
      return newState;
    });
  }, []);

  const setExpandedSubGroups = useCallback((subGroups: string[]) => {
    setNavigationState(prev => {
      const newState = { ...prev, expandedSubGroups: subGroups };
      try {
        writeStored(sessionStorage, STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
      return newState;
    });
  }, []);

  // Clear state (useful for reset)
  const clearState = useCallback(() => {
    try {
      removeStored(sessionStorage, STORAGE_KEY);
      setNavigationState(defaultState);
    } catch (error) {
      console.error('Failed to clear navigation state:', error);
    }
  }, []);

  return {
    navigationState,
    setActiveTab,
    setExpandedGroups,
    setExpandedLayers,
    setExpandedSubGroups,
    setScrollPosition,
    saveState,
    clearState
  };
};
