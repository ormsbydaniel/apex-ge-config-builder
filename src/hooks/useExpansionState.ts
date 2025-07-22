import { useState, useCallback } from 'react';

/**
 * Unified expansion state management hook
 * Phase 1 Refactoring: Consolidate all expansion-related state management
 */

export interface ExpansionState {
  // Data source expansion
  expandedLayerAfterDataSource: string | null;
  // Layer creation expansion  
  expandedLayerAfterCreation: string | null;
  // Layer editing expansion
  expandedLayerAfterEdit: string | null;
  // Group expansion after actions
  expandedGroupAfterAction: string | null;
}

export interface ExpansionActions {
  // Setters
  setExpandedAfterDataSource: (cardId: string | null) => void;
  setExpandedAfterCreation: (cardId: string | null) => void;
  setExpandedAfterEdit: (cardId: string | null) => void;
  setExpandedAfterGroupAction: (groupName: string | null) => void;
  
  // Clearers
  clearExpandedLayer: () => void;
  clearExpandedLayerAfterCreation: () => void;
  clearExpandedLayerAfterEdit: () => void;
  clearExpandedGroup: () => void;
  
  // Combined actions
  handleLayerCreated: (cardId: string | null, groupName?: string | null) => void;
  handleLayerEdited: (cardId: string | null, groupName?: string | null) => void;
}

export type UseExpansionStateReturn = ExpansionState & ExpansionActions;

/**
 * Hook for managing expansion state across the application
 */
export const useExpansionState = (): UseExpansionStateReturn => {
  const [expandedLayerAfterDataSource, setExpandedLayerAfterDataSource] = useState<string | null>(null);
  const [expandedLayerAfterCreation, setExpandedLayerAfterCreation] = useState<string | null>(null);
  const [expandedLayerAfterEdit, setExpandedLayerAfterEdit] = useState<string | null>(null);
  const [expandedGroupAfterAction, setExpandedGroupAfterAction] = useState<string | null>(null);

  // Individual setters
  const setExpandedAfterDataSource = useCallback((cardId: string | null) => {
    setExpandedLayerAfterDataSource(cardId);
  }, []);

  const setExpandedAfterCreation = useCallback((cardId: string | null) => {
    setExpandedLayerAfterCreation(cardId);
  }, []);

  const setExpandedAfterEdit = useCallback((cardId: string | null) => {
    setExpandedLayerAfterEdit(cardId);
  }, []);

  const setExpandedAfterGroupAction = useCallback((groupName: string | null) => {
    setExpandedGroupAfterAction(groupName);
  }, []);

  // Individual clearers
  const clearExpandedLayer = useCallback(() => {
    setExpandedLayerAfterDataSource(null);
  }, []);

  const clearExpandedLayerAfterCreation = useCallback(() => {
    setExpandedLayerAfterCreation(null);
  }, []);

  const clearExpandedLayerAfterEdit = useCallback(() => {
    setExpandedLayerAfterEdit(null);
  }, []);

  const clearExpandedGroup = useCallback(() => {
    setExpandedGroupAfterAction(null);
  }, []);

  // Combined action handlers
  const handleLayerCreated = useCallback((cardId: string | null, groupName?: string | null) => {
    setExpandedAfterCreation(cardId);
    if (groupName) {
      setExpandedAfterGroupAction(groupName);
    }
  }, [setExpandedAfterCreation, setExpandedAfterGroupAction]);

  const handleLayerEdited = useCallback((cardId: string | null, groupName?: string | null) => {
    setExpandedAfterEdit(cardId);
    if (groupName) {
      setExpandedAfterGroupAction(groupName);
    }
  }, [setExpandedAfterEdit, setExpandedAfterGroupAction]);

  return {
    // State
    expandedLayerAfterDataSource,
    expandedLayerAfterCreation,
    expandedLayerAfterEdit,
    expandedGroupAfterAction,
    
    // Actions
    setExpandedAfterDataSource,
    setExpandedAfterCreation,
    setExpandedAfterEdit,
    setExpandedAfterGroupAction,
    clearExpandedLayer,
    clearExpandedLayerAfterCreation,
    clearExpandedLayerAfterEdit,
    clearExpandedGroup,
    handleLayerCreated,
    handleLayerEdited
  };
};