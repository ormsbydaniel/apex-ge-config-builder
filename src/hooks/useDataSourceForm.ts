
import { useState, useCallback } from 'react';

export const useDataSourceForm = () => {
  const [showDataSourceForm, setShowDataSourceForm] = useState(false);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);

  const handleStartDataSourceForm = useCallback((layerIndex: number) => {
    setSelectedLayerIndex(layerIndex);
    setShowDataSourceForm(true);
  }, []);

  const handleCancelDataSource = useCallback(() => {
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
  }, []);

  const handleDataSourceComplete = useCallback(() => {
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
  }, []);

  return {
    showDataSourceForm,
    selectedLayerIndex,
    handleStartDataSourceForm,
    handleCancelDataSource,
    handleDataSourceComplete
  };
};
