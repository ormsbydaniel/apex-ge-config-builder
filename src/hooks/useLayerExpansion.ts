
import { useState, useCallback } from 'react';

export const useLayerExpansion = () => {
  const [expandedLayerAfterDataSource, setExpandedLayerAfterDataSource] = useState<string | null>(null);
  const [expandedLayerAfterCreation, setExpandedLayerAfterCreation] = useState<string | null>(null);
  const [expandedGroupAfterAction, setExpandedGroupAfterAction] = useState<string | null>(null);
  const [expandedLayerAfterEdit, setExpandedLayerAfterEdit] = useState<string | null>(null);

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

  const handleLayerCreated = useCallback((groupName: string, layerIndex: number) => {
    const cardId = `${groupName}-${layerIndex}`;
    setExpandedAfterCreation(cardId);
    setExpandedAfterGroupAction(groupName);
  }, [setExpandedAfterCreation, setExpandedAfterGroupAction]);

  const handleLayerEdited = useCallback((groupName: string, layerIndex: number) => {
    const cardId = `${groupName}-${layerIndex}`;
    setExpandedAfterEdit(cardId);
    setExpandedAfterGroupAction(groupName);
  }, [setExpandedAfterEdit, setExpandedAfterGroupAction]);

  return {
    expandedLayerAfterDataSource,
    expandedLayerAfterCreation,
    expandedLayerAfterEdit,
    expandedGroupAfterAction,
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
