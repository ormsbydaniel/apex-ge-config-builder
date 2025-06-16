import React from 'react';

export const useLayerFormState = () => {
  const [showDataSourceForm, setShowDataSourceForm] = React.useState(false);
  const [selectedLayerIndex, setSelectedLayerIndex] = React.useState<number | null>(null);
  const [expandedLayerAfterDataSource, setExpandedLayerAfterDataSource] = React.useState<string | null>(null);
  const [expandedLayerAfterCreation, setExpandedLayerAfterCreation] = React.useState<string | null>(null);
  const [expandedGroupAfterAction, setExpandedGroupAfterAction] = React.useState<string | null>(null);

  const handleStartDataSourceForm = (layerIndex: number, layerCardId?: string) => {
    setSelectedLayerIndex(layerIndex);
    setShowDataSourceForm(true);
    if (layerCardId) {
      setExpandedLayerAfterDataSource(layerCardId);
    }
  };

  const handleCancelDataSource = () => {
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
    setExpandedLayerAfterDataSource(null);
  };

  const handleDataSourceComplete = () => {
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
    // Keep the expandedLayerAfterDataSource for use in the parent component
  };

  const handleLayerCreated = (groupName: string, layerIndex: number) => {
    const cardId = `${groupName}-${layerIndex}`;
    setExpandedLayerAfterCreation(cardId);
    setExpandedGroupAfterAction(groupName);
  };

  const clearExpandedLayer = () => {
    setExpandedLayerAfterDataSource(null);
  };

  const clearExpandedLayerAfterCreation = () => {
    setExpandedLayerAfterCreation(null);
  };

  const clearExpandedGroup = () => {
    setExpandedGroupAfterAction(null);
  };

  return {
    showDataSourceForm,
    selectedLayerIndex,
    expandedLayerAfterDataSource,
    expandedLayerAfterCreation,
    expandedGroupAfterAction,
    handleStartDataSourceForm,
    handleCancelDataSource,
    handleDataSourceComplete,
    handleLayerCreated,
    clearExpandedLayer,
    clearExpandedLayerAfterCreation,
    clearExpandedGroup
  };
};
