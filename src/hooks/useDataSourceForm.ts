
import { useState, useCallback } from 'react';

export const useDataSourceForm = () => {
  const [showDataSourceForm, setShowDataSourceForm] = useState(false);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);

  const handleStartDataSourceForm = useCallback((layerIndex: number) => {
    console.log('=== useDataSourceForm.handleStartDataSourceForm ===');
    console.log('layerIndex received:', layerIndex);
    setSelectedLayerIndex(layerIndex);
    setShowDataSourceForm(true);
    console.log('State updated - selectedLayerIndex:', layerIndex, 'showDataSourceForm: true');
  }, []);

  const handleCancelDataSource = useCallback(() => {
    console.log('=== useDataSourceForm.handleCancelDataSource ===');
    setShowDataSourceForm(false);
    setSelectedLayerIndex(null);
  }, []);

  const handleDataSourceComplete = useCallback(() => {
    console.log('=== useDataSourceForm.handleDataSourceComplete ===');
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
