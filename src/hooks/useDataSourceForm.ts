
import { useState, useCallback } from 'react';

export const useDataSourceForm = () => {
  const [showDataSourceForm, setShowDataSourceForm] = useState(false);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);
  const [canceledLayerIndex, setCanceledLayerIndex] = useState<number | null>(null);

  const handleStartDataSourceForm = useCallback((layerIndex: number) => {
    console.log('handleStartDataSourceForm called with layerIndex:', layerIndex);
    setSelectedLayerIndex(layerIndex);
    setShowDataSourceForm(true);
    console.log('Data source form state set - selectedLayerIndex:', layerIndex, 'showDataSourceForm: true');
  }, []);

  const handleCancelDataSource = useCallback(() => {
    // Store the canceled layer index so we can expand it later
    setCanceledLayerIndex(selectedLayerIndex);
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
  }, [selectedLayerIndex]);

  const handleDataSourceComplete = useCallback(() => {
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
  }, []);

  const clearDataSourceForm = useCallback(() => {
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
    setCanceledLayerIndex(null);
  }, []);

  const clearCanceledLayerIndex = useCallback(() => {
    setCanceledLayerIndex(null);
  }, []);

  return {
    showDataSourceForm,
    selectedLayerIndex,
    canceledLayerIndex,
    handleStartDataSourceForm,
    handleCancelDataSource,
    handleDataSourceComplete,
    clearDataSourceForm,
    clearCanceledLayerIndex
  };
};
