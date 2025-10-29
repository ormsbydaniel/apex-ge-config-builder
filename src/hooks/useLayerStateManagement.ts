import { useState, useCallback, useReducer } from 'react';

// Types for the consolidated state
interface LayerExpansionState {
  expandedCards: Set<string>;
  expandedAfterDataSource: string | null;
  expandedAfterCreation: string | null;
  expandedAfterEdit: string | null;
  expandedGroupAfterAction: string | null;
}

interface DataSourceFormState {
  showDataSourceForm: boolean;
  selectedLayerIndex: number | null;
  canceledLayerIndex: number | null;
  isAddingStatistics: boolean; // Track if adding statistics source
  showConstraintForm: boolean; // Track if adding constraint source
  isAddingConstraint: boolean; // Track if adding constraint source
  editingConstraintIndex: number | null; // Track which constraint is being edited
  editingConstraintLayerIndex: number | null; // Track which layer's constraint is being edited
  editingDataSourceIndex: number | null; // Track which data source is being edited
  editingDataSourceLayerIndex: number | null; // Track which layer's data source is being edited
}

interface LayerStateManagementState {
  expansion: LayerExpansionState;
  dataSourceForm: DataSourceFormState;
}

// Action types for the reducer
type LayerStateAction =
  | { type: 'TOGGLE_CARD'; cardId: string }
  | { type: 'EXPAND_CARD'; cardId: string }
  | { type: 'COLLAPSE_CARD'; cardId: string }
  | { type: 'SET_EXPANDED_AFTER_DATA_SOURCE'; cardId: string | null }
  | { type: 'SET_EXPANDED_AFTER_CREATION'; cardId: string | null }
  | { type: 'SET_EXPANDED_AFTER_EDIT'; cardId: string | null }
  | { type: 'SET_EXPANDED_GROUP_AFTER_ACTION'; groupName: string | null }
  | { type: 'CLEAR_EXPANDED_AFTER_DATA_SOURCE' }
  | { type: 'CLEAR_EXPANDED_AFTER_CREATION' }
  | { type: 'CLEAR_EXPANDED_AFTER_EDIT' }
  | { type: 'CLEAR_EXPANDED_GROUP' }
  | { type: 'START_DATA_SOURCE_FORM'; layerIndex: number; isAddingStatistics?: boolean }
  | { type: 'CANCEL_DATA_SOURCE_FORM'; selectedLayerIndex: number | null }
  | { type: 'COMPLETE_DATA_SOURCE_FORM' }
  | { type: 'CLEAR_DATA_SOURCE_FORM' }
  | { type: 'CLEAR_CANCELED_LAYER_INDEX' }
  | { type: 'START_CONSTRAINT_FORM'; layerIndex: number; isAddingConstraint?: boolean }
  | { type: 'CANCEL_CONSTRAINT_FORM'; selectedLayerIndex: number | null }
  | { type: 'COMPLETE_CONSTRAINT_FORM' }
  | { type: 'START_EDIT_CONSTRAINT'; layerIndex: number; constraintIndex: number }
  | { type: 'CLEAR_EDIT_CONSTRAINT' }
  | { type: 'START_EDIT_DATA_SOURCE'; layerIndex: number; dataSourceIndex: number }
  | { type: 'CLEAR_EDIT_DATA_SOURCE' };

// Initial state
const initialState: LayerStateManagementState = {
  expansion: {
    expandedCards: new Set(),
    expandedAfterDataSource: null,
    expandedAfterCreation: null,
    expandedAfterEdit: null,
    expandedGroupAfterAction: null,
  },
  dataSourceForm: {
    showDataSourceForm: false,
    selectedLayerIndex: null,
    canceledLayerIndex: null,
    isAddingStatistics: false,
    showConstraintForm: false,
    isAddingConstraint: false,
    editingConstraintIndex: null,
    editingConstraintLayerIndex: null,
    editingDataSourceIndex: null,
    editingDataSourceLayerIndex: null,
  },
};

// Reducer function
function layerStateReducer(
  state: LayerStateManagementState,
  action: LayerStateAction
): LayerStateManagementState {
  switch (action.type) {
    case 'TOGGLE_CARD': {
      const newExpandedCards = new Set(state.expansion.expandedCards);
      if (newExpandedCards.has(action.cardId)) {
        newExpandedCards.delete(action.cardId);
      } else {
        newExpandedCards.add(action.cardId);
      }
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedCards: newExpandedCards,
        },
      };
    }

    case 'EXPAND_CARD': {
      const newExpandedCards = new Set(state.expansion.expandedCards);
      newExpandedCards.add(action.cardId);
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedCards: newExpandedCards,
        },
      };
    }

    case 'COLLAPSE_CARD': {
      const newExpandedCards = new Set(state.expansion.expandedCards);
      newExpandedCards.delete(action.cardId);
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedCards: newExpandedCards,
        },
      };
    }

    case 'SET_EXPANDED_AFTER_DATA_SOURCE':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedAfterDataSource: action.cardId,
        },
      };

    case 'SET_EXPANDED_AFTER_CREATION':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedAfterCreation: action.cardId,
        },
      };

    case 'SET_EXPANDED_AFTER_EDIT':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedAfterEdit: action.cardId,
        },
      };

    case 'SET_EXPANDED_GROUP_AFTER_ACTION':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedGroupAfterAction: action.groupName,
        },
      };

    case 'CLEAR_EXPANDED_AFTER_DATA_SOURCE':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedAfterDataSource: null,
        },
      };

    case 'CLEAR_EXPANDED_AFTER_CREATION':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedAfterCreation: null,
        },
      };

    case 'CLEAR_EXPANDED_AFTER_EDIT':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedAfterEdit: null,
        },
      };

    case 'CLEAR_EXPANDED_GROUP':
      return {
        ...state,
        expansion: {
          ...state.expansion,
          expandedGroupAfterAction: null,
        },
      };

    case 'START_DATA_SOURCE_FORM':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          selectedLayerIndex: action.layerIndex,
          showDataSourceForm: true,
          isAddingStatistics: action.isAddingStatistics || false,
        },
      };

    case 'CANCEL_DATA_SOURCE_FORM':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          canceledLayerIndex: action.selectedLayerIndex,
          showDataSourceForm: false,
          selectedLayerIndex: null,
          isAddingStatistics: false,
        },
      };

    case 'COMPLETE_DATA_SOURCE_FORM':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          showDataSourceForm: false,
          selectedLayerIndex: null,
          isAddingStatistics: false,
        },
      };

    case 'CLEAR_DATA_SOURCE_FORM':
      return {
        ...state,
        dataSourceForm: {
          showDataSourceForm: false,
          selectedLayerIndex: null,
          canceledLayerIndex: null,
          isAddingStatistics: false,
          showConstraintForm: false,
          isAddingConstraint: false,
          editingConstraintIndex: null,
          editingConstraintLayerIndex: null,
          editingDataSourceIndex: null,
          editingDataSourceLayerIndex: null,
        },
      };

    case 'CLEAR_CANCELED_LAYER_INDEX':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          canceledLayerIndex: null,
        },
      };

    case 'START_CONSTRAINT_FORM':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          selectedLayerIndex: action.layerIndex,
          showConstraintForm: true,
          isAddingConstraint: action.isAddingConstraint || false,
          // Clear editing state when starting a new add operation
          editingConstraintIndex: null,
          editingConstraintLayerIndex: null,
        },
      };

    case 'CANCEL_CONSTRAINT_FORM':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          canceledLayerIndex: action.selectedLayerIndex,
          showConstraintForm: false,
          selectedLayerIndex: null,
          isAddingConstraint: false,
          // Clear editing state when canceling
          editingConstraintIndex: null,
          editingConstraintLayerIndex: null,
        },
      };

    case 'COMPLETE_CONSTRAINT_FORM':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          showConstraintForm: false,
          selectedLayerIndex: null,
          isAddingConstraint: false,
          editingConstraintIndex: null,
          editingConstraintLayerIndex: null,
        },
      };

    case 'START_EDIT_CONSTRAINT':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          selectedLayerIndex: action.layerIndex,
          showConstraintForm: true,
          editingConstraintIndex: action.constraintIndex,
          editingConstraintLayerIndex: action.layerIndex,
        },
      };

    case 'CLEAR_EDIT_CONSTRAINT':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          editingConstraintIndex: null,
          editingConstraintLayerIndex: null,
        },
      };

    case 'START_EDIT_DATA_SOURCE':
      console.log('[useLayerStateManagement reducer] START_EDIT_DATA_SOURCE action:', action);
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          selectedLayerIndex: action.layerIndex,
          showDataSourceForm: true,
          editingDataSourceIndex: action.dataSourceIndex,
          editingDataSourceLayerIndex: action.layerIndex,
        },
      };

    case 'CLEAR_EDIT_DATA_SOURCE':
      return {
        ...state,
        dataSourceForm: {
          ...state.dataSourceForm,
          editingDataSourceIndex: null,
          editingDataSourceLayerIndex: null,
        },
      };

    default:
      return state;
  }
}

/**
 * Consolidated hook for managing all layer state:
 * - Card expansion/collapse
 * - Expansion after various actions (data source, creation, edit)
 * - Data source form state
 * - Group expansion state
 */
export const useLayerStateManagement = () => {
  const [state, dispatch] = useReducer(layerStateReducer, initialState);

  // Card expansion actions
  const toggleCard = useCallback((cardId: string) => {
    dispatch({ type: 'TOGGLE_CARD', cardId });
  }, []);

  const expandCard = useCallback((cardId: string) => {
    dispatch({ type: 'EXPAND_CARD', cardId });
  }, []);

  const collapseCard = useCallback((cardId: string) => {
    dispatch({ type: 'COLLAPSE_CARD', cardId });
  }, []);

  const isExpanded = useCallback(
    (cardId: string) => state.expansion.expandedCards.has(cardId),
    [state.expansion.expandedCards]
  );

  // Expansion after actions
  const setExpandedAfterDataSource = useCallback((cardId: string | null) => {
    dispatch({ type: 'SET_EXPANDED_AFTER_DATA_SOURCE', cardId });
  }, []);

  const setExpandedAfterCreation = useCallback((cardId: string | null) => {
    dispatch({ type: 'SET_EXPANDED_AFTER_CREATION', cardId });
  }, []);

  const setExpandedAfterEdit = useCallback((cardId: string | null) => {
    dispatch({ type: 'SET_EXPANDED_AFTER_EDIT', cardId });
  }, []);

  const setExpandedGroupAfterAction = useCallback((groupName: string | null) => {
    dispatch({ type: 'SET_EXPANDED_GROUP_AFTER_ACTION', groupName });
  }, []);

  // Clear expansion states
  const clearExpandedAfterDataSource = useCallback(() => {
    dispatch({ type: 'CLEAR_EXPANDED_AFTER_DATA_SOURCE' });
  }, []);

  const clearExpandedAfterCreation = useCallback(() => {
    dispatch({ type: 'CLEAR_EXPANDED_AFTER_CREATION' });
  }, []);

  const clearExpandedAfterEdit = useCallback(() => {
    dispatch({ type: 'CLEAR_EXPANDED_AFTER_EDIT' });
  }, []);

  const clearExpandedGroup = useCallback(() => {
    dispatch({ type: 'CLEAR_EXPANDED_GROUP' });
  }, []);

  // High-level expansion handlers
  const handleLayerCreated = useCallback((groupName: string, layerIndex: number) => {
    const cardId = `layer-${layerIndex}`;
    dispatch({ type: 'SET_EXPANDED_AFTER_CREATION', cardId });
    dispatch({ type: 'SET_EXPANDED_GROUP_AFTER_ACTION', groupName });
  }, []);

  const handleLayerEdited = useCallback((groupName: string, layerIndex: number) => {
    const cardId = `layer-${layerIndex}`;
    dispatch({ type: 'SET_EXPANDED_AFTER_EDIT', cardId });
    dispatch({ type: 'SET_EXPANDED_GROUP_AFTER_ACTION', groupName });
  }, []);

  // Data source form actions
  const handleStartDataSourceForm = useCallback((layerIndex: number, layerCardId?: string, isAddingStatistics = false) => {
    dispatch({ type: 'START_DATA_SOURCE_FORM', layerIndex, isAddingStatistics });
    if (layerCardId) {
      dispatch({ type: 'SET_EXPANDED_AFTER_DATA_SOURCE', cardId: layerCardId });
    }
  }, []);

  const handleCancelDataSource = useCallback(() => {
    dispatch({ 
      type: 'CANCEL_DATA_SOURCE_FORM', 
      selectedLayerIndex: state.dataSourceForm.selectedLayerIndex 
    });
  }, [state.dataSourceForm.selectedLayerIndex]);

  const handleDataSourceComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE_DATA_SOURCE_FORM' });
  }, []);

  const clearDataSourceForm = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA_SOURCE_FORM' });
  }, []);

  const clearCanceledLayerIndex = useCallback(() => {
    dispatch({ type: 'CLEAR_CANCELED_LAYER_INDEX' });
  }, []);

  // Constraint form actions
  const handleStartConstraintForm = useCallback((layerIndex: number, layerCardId?: string, isAddingConstraint = false) => {
    dispatch({ type: 'START_CONSTRAINT_FORM', layerIndex, isAddingConstraint });
    if (layerCardId) {
      dispatch({ type: 'SET_EXPANDED_AFTER_DATA_SOURCE', cardId: layerCardId });
    }
  }, []);

  const handleCancelConstraint = useCallback(() => {
    dispatch({ 
      type: 'CANCEL_CONSTRAINT_FORM', 
      selectedLayerIndex: state.dataSourceForm.selectedLayerIndex 
    });
  }, [state.dataSourceForm.selectedLayerIndex]);

  const handleConstraintComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE_CONSTRAINT_FORM' });
  }, []);

  const handleStartEditConstraint = useCallback((layerIndex: number, constraintIndex: number, layerCardId?: string) => {
    dispatch({ type: 'START_EDIT_CONSTRAINT', layerIndex, constraintIndex });
    if (layerCardId) {
      dispatch({ type: 'SET_EXPANDED_AFTER_DATA_SOURCE', cardId: layerCardId });
    }
  }, []);

  const clearEditConstraint = useCallback(() => {
    dispatch({ type: 'CLEAR_EDIT_CONSTRAINT' });
  }, []);

  const handleStartEditDataSource = useCallback((layerIndex: number, dataSourceIndex: number, layerCardId?: string) => {
    console.log('[useLayerStateManagement] handleStartEditDataSource called with:', { layerIndex, dataSourceIndex, layerCardId });
    dispatch({ type: 'START_EDIT_DATA_SOURCE', layerIndex, dataSourceIndex });
    if (layerCardId) {
      dispatch({ type: 'SET_EXPANDED_AFTER_DATA_SOURCE', cardId: layerCardId });
    }
  }, []);

  const clearEditDataSource = useCallback(() => {
    dispatch({ type: 'CLEAR_EDIT_DATA_SOURCE' });
  }, []);

  return {
    // Card expansion state and actions
    expandedCards: state.expansion.expandedCards,
    toggleCard,
    expandCard,
    collapseCard,
    isExpanded,

    // Expansion after actions state (with legacy names for compatibility)
    expandedLayerAfterDataSource: state.expansion.expandedAfterDataSource,
    expandedLayerAfterCreation: state.expansion.expandedAfterCreation,
    expandedLayerAfterEdit: state.expansion.expandedAfterEdit,
    expandedGroupAfterAction: state.expansion.expandedGroupAfterAction,

    // Expansion after actions setters
    setExpandedAfterDataSource,
    setExpandedAfterCreation,
    setExpandedAfterEdit,
    setExpandedGroupAfterAction,

    // Clear expansion states (with legacy names for compatibility)
    clearExpandedLayer: clearExpandedAfterDataSource,
    clearExpandedLayerAfterCreation: clearExpandedAfterCreation,
    clearExpandedLayerAfterEdit: clearExpandedAfterEdit,
    clearExpandedGroup,

    // High-level expansion handlers
    handleLayerCreated,
    handleLayerEdited,

    // Data source form state
    showDataSourceForm: state.dataSourceForm.showDataSourceForm,
    selectedLayerIndex: state.dataSourceForm.selectedLayerIndex,
    canceledLayerIndex: state.dataSourceForm.canceledLayerIndex,
    isAddingStatistics: state.dataSourceForm.isAddingStatistics,

    // Data source form actions
    handleStartDataSourceForm,
    handleCancelDataSource,
    handleDataSourceComplete,
    clearDataSourceForm,
    clearCanceledLayerIndex,

    // Constraint form state
    showConstraintForm: state.dataSourceForm.showConstraintForm,
    isAddingConstraint: state.dataSourceForm.isAddingConstraint,
    editingConstraintIndex: state.dataSourceForm.editingConstraintIndex,
    editingConstraintLayerIndex: state.dataSourceForm.editingConstraintLayerIndex,

    // Constraint form actions
    handleStartConstraintForm,
    handleCancelConstraint,
    handleConstraintComplete,
    handleStartEditConstraint,
    clearEditConstraint,

    // Data source editing state
    editingDataSourceIndex: state.dataSourceForm.editingDataSourceIndex,
    editingDataSourceLayerIndex: state.dataSourceForm.editingDataSourceLayerIndex,

    // Data source editing actions
    handleStartEditDataSource,
    clearEditDataSource,
  };
};