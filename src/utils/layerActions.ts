
import { DataSource, isDataSourceItemArray } from '@/types/config';

export const createLayerActionHandlers = (
  config: { sources: DataSource[] },
  updateLayer: (index: number, layer: DataSource) => void,
  addLayer: (layer: DataSource) => void,
  setEditingLayerIndex: (index: number | null) => void,
  setSelectedLayerType: (type: any) => void,
  setShowLayerForm: (show: boolean) => void
) => {
  const handleEditLayer = (layerIndex: number) => {
    const layer = config.sources[layerIndex];
    const isSwipeLayer = layer.meta?.swipeConfig !== undefined;
    
    setEditingLayerIndex(layerIndex);
    setSelectedLayerType(isSwipeLayer ? 'swipe' : 'layerCard');
    setShowLayerForm(true);
  };

  const handleEditBaseLayer = (layerIndex: number) => {
    setEditingLayerIndex(layerIndex);
    setSelectedLayerType('base');
    setShowLayerForm(true);
  };

  const handleDuplicateLayer = (layerIndex: number) => {
    const originalLayer = config.sources[layerIndex];
    const duplicatedLayer: DataSource = {
      ...originalLayer,
      name: `${originalLayer.name} (Copy)`,
      // Deep clone the data array to avoid reference issues - only if it's an array
      data: isDataSourceItemArray(originalLayer.data) 
        ? originalLayer.data.map(dataItem => ({ ...dataItem }))
        : originalLayer.data,
      // Deep clone statistics array if it exists
      statistics: originalLayer.statistics 
        ? originalLayer.statistics.map(statsItem => ({ ...statsItem }))
        : undefined,
      // Deep clone meta if it exists, including gradient fields and swipe config
      ...(originalLayer.meta && {
        meta: {
          ...originalLayer.meta,
          attribution: { ...originalLayer.meta.attribution },
          categories: originalLayer.meta.categories ? [...originalLayer.meta.categories] : undefined,
          // Include gradient fields if they exist
          ...(originalLayer.meta.startColor && { startColor: originalLayer.meta.startColor }),
          ...(originalLayer.meta.endColor && { endColor: originalLayer.meta.endColor }),
          ...(originalLayer.meta.min !== undefined && { min: originalLayer.meta.min }),
          ...(originalLayer.meta.max !== undefined && { max: originalLayer.meta.max }),
          // Deep clone swipe config if it exists
          ...(originalLayer.meta.swipeConfig && {
            swipeConfig: { ...originalLayer.meta.swipeConfig }
          })
        }
      }),
      // Deep clone layout if it exists
      ...(originalLayer.layout && {
        layout: {
          ...originalLayer.layout,
          layerCard: originalLayer.layout.layerCard ? {
            ...originalLayer.layout.layerCard,
            legend: originalLayer.layout.layerCard.legend ? { 
              ...originalLayer.layout.layerCard.legend 
            } : undefined,
            controls: originalLayer.layout.layerCard.controls ? { ...originalLayer.layout.layerCard.controls } : undefined
          } : undefined
        }
      })
    };
    
    addLayer(duplicatedLayer);
  };

  const handleRemoveDataSource = (layerIndex: number, dataSourceIndex: number) => {
    const layer = config.sources[layerIndex];
    if (isDataSourceItemArray(layer.data)) {
      const updatedLayer = {
        ...layer,
        data: layer.data.filter((_, index) => index !== dataSourceIndex)
      };
      updateLayer(layerIndex, updatedLayer);
    }
  };

  const handleRemoveAllDataSources = (layerIndex: number) => {
    const layer = config.sources[layerIndex];
    const updatedLayer = {
      ...layer,
      data: []
    };
    updateLayer(layerIndex, updatedLayer);
  };

  const handleRemoveStatisticsSource = (layerIndex: number, statsIndex: number) => {
    const layer = config.sources[layerIndex];
    if (layer.statistics) {
      const updatedLayer = {
        ...layer,
        statistics: layer.statistics.filter((_, index) => index !== statsIndex)
      };
      updateLayer(layerIndex, updatedLayer);
    }
  };

  const handleEditDataSource = (layerIndex: number, dataIndex: number) => {
    // Placeholder for Phase 2 implementation
    console.log(`Edit data source at layer ${layerIndex}, data index ${dataIndex}`);
  };

  const handleEditStatisticsSource = (layerIndex: number, statsIndex: number) => {
    // Placeholder for Phase 2 implementation
    console.log(`Edit statistics source at layer ${layerIndex}, stats index ${statsIndex}`);
  };

  const handleRemoveConstraintSource = (layerIndex: number, constraintIndex: number) => {
    const layer = config.sources[layerIndex];
    if (layer.constraints) {
      // Filter out the deleted constraint
      const remainingConstraints = layer.constraints.filter((_, index) => index !== constraintIndex);
      
      // Renumber all remaining constraints sequentially from 2
      const renumberedConstraints = remainingConstraints.map((constraint, index) => ({
        ...constraint,
        bandIndex: index + 2  // Start from 2
      }));
      
      const updatedLayer = {
        ...layer,
        constraints: renumberedConstraints
      };
      updateLayer(layerIndex, updatedLayer);
    }
  };

  const handleEditConstraintSource = (layerIndex: number, constraintIndex: number) => {
    // Placeholder for Phase 2 implementation
    console.log(`Edit constraint source at layer ${layerIndex}, constraint index ${constraintIndex}`);
  };

  const handleMoveConstraintUp = (layerIndex: number, constraintIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.constraints || constraintIndex === 0) return;

    const newConstraints = [...layer.constraints];
    [newConstraints[constraintIndex - 1], newConstraints[constraintIndex]] = 
      [newConstraints[constraintIndex], newConstraints[constraintIndex - 1]];
    
    // Renumber bandIndex sequentially from 2
    const renumberedConstraints = newConstraints.map((constraint, index) => ({
      ...constraint,
      bandIndex: index + 2
    }));

    updateLayer(layerIndex, { ...layer, constraints: renumberedConstraints });
  };

  const handleMoveConstraintDown = (layerIndex: number, constraintIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.constraints || constraintIndex === layer.constraints.length - 1) return;

    const newConstraints = [...layer.constraints];
    [newConstraints[constraintIndex], newConstraints[constraintIndex + 1]] = 
      [newConstraints[constraintIndex + 1], newConstraints[constraintIndex]];
    
    // Renumber bandIndex sequentially from 2
    const renumberedConstraints = newConstraints.map((constraint, index) => ({
      ...constraint,
      bandIndex: index + 2
    }));

    updateLayer(layerIndex, { ...layer, constraints: renumberedConstraints });
  };

  const handleMoveConstraintToTop = (layerIndex: number, constraintIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.constraints || constraintIndex === 0) return;

    const newConstraints = [...layer.constraints];
    const [movedConstraint] = newConstraints.splice(constraintIndex, 1);
    newConstraints.unshift(movedConstraint);
    
    // Renumber bandIndex sequentially from 2
    const renumberedConstraints = newConstraints.map((constraint, index) => ({
      ...constraint,
      bandIndex: index + 2
    }));

    updateLayer(layerIndex, { ...layer, constraints: renumberedConstraints });
  };

  const handleMoveConstraintToBottom = (layerIndex: number, constraintIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.constraints || constraintIndex === layer.constraints.length - 1) return;

    const newConstraints = [...layer.constraints];
    const [movedConstraint] = newConstraints.splice(constraintIndex, 1);
    newConstraints.push(movedConstraint);
    
    // Renumber bandIndex sequentially from 2
    const renumberedConstraints = newConstraints.map((constraint, index) => ({
      ...constraint,
      bandIndex: index + 2
    }));

    updateLayer(layerIndex, { ...layer, constraints: renumberedConstraints });
  };

  // Workflow handlers
  const handleAddWorkflow = (layerIndex: number, workflow: any) => {
    const layer = config.sources[layerIndex];
    const updatedLayer = {
      ...layer,
      workflows: [...(layer.workflows || []), workflow]
    };
    updateLayer(layerIndex, updatedLayer);
  };

  const handleUpdateWorkflow = (layerIndex: number, workflowIndex: number, workflow: any) => {
    const layer = config.sources[layerIndex];
    if (!layer.workflows) return;

    const updatedWorkflows = [...layer.workflows];
    updatedWorkflows[workflowIndex] = workflow;
    
    updateLayer(layerIndex, { ...layer, workflows: updatedWorkflows });
  };

  const handleRemoveWorkflow = (layerIndex: number, workflowIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.workflows) return;

    const updatedLayer = {
      ...layer,
      workflows: layer.workflows.filter((_, index) => index !== workflowIndex)
    };
    updateLayer(layerIndex, updatedLayer);
  };

  const handleMoveWorkflowUp = (layerIndex: number, workflowIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.workflows || workflowIndex === 0) return;

    const newWorkflows = [...layer.workflows];
    [newWorkflows[workflowIndex - 1], newWorkflows[workflowIndex]] = 
      [newWorkflows[workflowIndex], newWorkflows[workflowIndex - 1]];

    updateLayer(layerIndex, { ...layer, workflows: newWorkflows });
  };

  const handleMoveWorkflowDown = (layerIndex: number, workflowIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.workflows || workflowIndex === layer.workflows.length - 1) return;

    const newWorkflows = [...layer.workflows];
    [newWorkflows[workflowIndex], newWorkflows[workflowIndex + 1]] = 
      [newWorkflows[workflowIndex + 1], newWorkflows[workflowIndex]];

    updateLayer(layerIndex, { ...layer, workflows: newWorkflows });
  };

  const handleMoveWorkflowToTop = (layerIndex: number, workflowIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.workflows || workflowIndex === 0) return;

    const newWorkflows = [...layer.workflows];
    const [movedWorkflow] = newWorkflows.splice(workflowIndex, 1);
    newWorkflows.unshift(movedWorkflow);

    updateLayer(layerIndex, { ...layer, workflows: newWorkflows });
  };

  const handleMoveWorkflowToBottom = (layerIndex: number, workflowIndex: number) => {
    const layer = config.sources[layerIndex];
    if (!layer.workflows || workflowIndex === layer.workflows.length - 1) return;

    const newWorkflows = [...layer.workflows];
    const [movedWorkflow] = newWorkflows.splice(workflowIndex, 1);
    newWorkflows.push(movedWorkflow);

    updateLayer(layerIndex, { ...layer, workflows: newWorkflows });
  };

  return {
    handleEditLayer,
    handleEditBaseLayer,
    handleDuplicateLayer,
    handleRemoveDataSource,
    handleRemoveAllDataSources,
    handleRemoveStatisticsSource,
    handleEditDataSource,
    handleEditStatisticsSource,
    handleRemoveConstraintSource,
    handleEditConstraintSource,
    handleMoveConstraintUp,
    handleMoveConstraintDown,
    handleMoveConstraintToTop,
    handleMoveConstraintToBottom,
    handleAddWorkflow,
    handleUpdateWorkflow,
    handleRemoveWorkflow,
    handleMoveWorkflowUp,
    handleMoveWorkflowDown,
    handleMoveWorkflowToTop,
    handleMoveWorkflowToBottom
  };
};
