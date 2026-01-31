import React, { useState, useEffect, useCallback } from 'react';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import LayerGroup from './components/LayerGroup';
import BaseLayerGroup from './components/BaseLayerGroup';
import UngroupedLayersGroup from './components/UngroupedLayersGroup';
import AddInterfaceGroupDialog from './components/AddInterfaceGroupDialog';
import DeleteInterfaceGroupDialog from './components/DeleteInterfaceGroupDialog';
import SortableInterfaceGroup from './components/SortableInterfaceGroup';
import { useInterfaceGroupManagement } from '@/hooks/useInterfaceGroupManagement';
import { useToast } from '@/hooks/use-toast';
import { LayerDndProvider } from '@/contexts/LayerDndContext';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
interface LayerHierarchyProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
  };
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onAddStatisticsSource: (layerIndex: number) => void;
  onAddConstraintSource?: (layerIndex: number) => void;
  onRemoveConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onEditConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintUp: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintDown: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintToTop: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintToBottom: (layerIndex: number, constraintIndex: number) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onAddLayer: (groupName: string, subGroupName?: string) => void;
  onAddBaseLayer: () => void;
  onAddRecommendedBaseLayers: () => void;
  isLoadingRecommended?: boolean;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  expandedLayerAfterCreation?: string | null;
  expandedLayerAfterEdit?: string | null;
  expandedGroupAfterAction?: string | null;
  onClearExpandedLayer?: () => void;
  onClearExpandedLayerAfterEdit?: () => void;
  onClearExpandedGroup?: () => void;
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  onExpansionStateChange?: (layers: string[], groups: string[], subGroups?: string[]) => void;
  navigationState?: { expandedGroups: string[]; expandedLayers: string[]; expandedSubGroups?: string[] };
}

const LayerHierarchy = ({
  config,
  onRemove,
  onEdit,
  onEditBaseLayer,
  onDuplicate,
  onUpdateLayer,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onAddStatisticsSource,
  onAddConstraintSource,
  onRemoveConstraintSource,
  onEditConstraintSource,
  onMoveConstraintUp,
  onMoveConstraintDown,
  onMoveConstraintToTop,
  onMoveConstraintToBottom,
  onMoveLayer,
  onAddLayer,
  onAddBaseLayer,
  onAddRecommendedBaseLayers,
  isLoadingRecommended,
  updateConfig,
  expandedLayerAfterCreation,
  expandedLayerAfterEdit,
  expandedGroupAfterAction,
  onClearExpandedLayer,
  onClearExpandedLayerAfterEdit,
  onClearExpandedGroup,
  expandedLayers,
  onToggleLayer,
  onExpansionStateChange,
  navigationState
}: LayerHierarchyProps) => {
  const { toast } = useToast();
  
  // Group expansion state - restore from navigationState if available
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (navigationState?.expandedGroups) {
      return new Set(navigationState.expandedGroups.filter(g => g !== '__BASE_LAYERS__' && g !== '__UNGROUPED__'));
    }
    return new Set();
  });
  const [expandedBaseLayers, setExpandedBaseLayers] = useState(() => {
    return navigationState?.expandedGroups?.includes('__BASE_LAYERS__') || false;
  });
  const [expandedUngroupedLayers, setExpandedUngroupedLayers] = useState(() => {
    return navigationState?.expandedGroups?.includes('__UNGROUPED__') || false;
  });
  
  // Sub-group expansion state - keyed by "parentGroup::subGroup"
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(() => {
    if (navigationState?.expandedSubGroups) {
      return new Set(navigationState.expandedSubGroups);
    }
    return new Set();
  });
  
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [deleteGroupName, setDeleteGroupName] = useState<string | null>(null);

  const {
    editingIndex,
    editingValue,
    setEditingValue,
    getLayerCountsByGroup,
    getMigrationOptions,
    addInterfaceGroup,
    removeInterfaceGroup,
    migrateLayersAndRemoveGroup,
    startRename,
    cancelRename,
    confirmRename
  } = useInterfaceGroupManagement(config.interfaceGroups, config.sources, updateConfig);

  // Handle group rename with expansion state preservation
  const handleGroupRename = (oldName: string, newName: string) => {
    const updatedGroups = config.interfaceGroups.map(group => 
      group === oldName ? newName : group
    );

    // Update sources that use the old interface group name
    const updatedSources = config.sources.map(source => 
      source.layout?.interfaceGroup === oldName
        ? { ...source, layout: { ...source.layout, interfaceGroup: newName } }
        : source
    );

    updateConfig({
      interfaceGroups: updatedGroups,
      sources: updatedSources
    });

    // Preserve expansion state by updating the expanded groups set
    if (expandedGroups.has(oldName)) {
      const newExpanded = new Set(expandedGroups);
      newExpanded.delete(oldName);
      newExpanded.add(newName);
      setExpandedGroups(newExpanded);
    }
    
    // Also update sub-group expansion state keys
    const newExpandedSubGroups = new Set<string>();
    expandedSubGroups.forEach(key => {
      if (key.startsWith(`${oldName}::`)) {
        newExpandedSubGroups.add(key.replace(`${oldName}::`, `${newName}::`));
      } else {
        newExpandedSubGroups.add(key);
      }
    });
    setExpandedSubGroups(newExpandedSubGroups);
  };

  // Sub-group management handlers
  const handleAddSubGroup = (parentGroup: string, subGroupName: string, selectedLayerIndices: number[]) => {
    if (selectedLayerIndices.length > 0) {
      // Move selected layers into the sub-group
      const updatedSources = config.sources.map((source, idx) => {
        if (selectedLayerIndices.includes(idx)) {
          return {
            ...source,
            layout: {
              ...source.layout,
              subinterfaceGroup: subGroupName
            }
          };
        }
        return source;
      });
      
      updateConfig({ sources: updatedSources });
      
      toast({
        title: "Sub-Group Created",
        description: `"${subGroupName}" created with ${selectedLayerIndices.length} layer${selectedLayerIndices.length !== 1 ? 's' : ''}.`,
      });
    } else {
      // No layers selected - just trigger layer creation with subinterfaceGroup pre-set
      toast({
        title: "Sub-Group Ready",
        description: `Add a layer to create the "${subGroupName}" sub-group.`,
      });
      onAddLayer(parentGroup, subGroupName);
    }
    
    // Expand the sub-group after creation
    const key = `${parentGroup}::${subGroupName}`;
    const newExpanded = new Set(expandedSubGroups);
    newExpanded.add(key);
    setExpandedSubGroups(newExpanded);
  };

  const handleRenameSubGroup = (parentGroup: string, oldName: string, newName: string) => {
    // Update all layers in this sub-group
    const updatedSources = config.sources.map(source =>
      source.layout?.interfaceGroup === parentGroup &&
      source.layout?.subinterfaceGroup === oldName
        ? {
            ...source,
            layout: { ...source.layout, subinterfaceGroup: newName }
          }
        : source
    );

    updateConfig({ sources: updatedSources });

    // Preserve expansion state
    const oldKey = `${parentGroup}::${oldName}`;
    const newKey = `${parentGroup}::${newName}`;
    if (expandedSubGroups.has(oldKey)) {
      const newExpanded = new Set(expandedSubGroups);
      newExpanded.delete(oldKey);
      newExpanded.add(newKey);
      setExpandedSubGroups(newExpanded);
    }

    toast({
      title: "Sub-Group Renamed",
      description: `"${oldName}" has been renamed to "${newName}".`,
    });
  };

  const handleRemoveSubGroup = (parentGroup: string, subGroupName: string) => {
    // Remove all layers in this sub-group
    const updatedSources = config.sources.filter(source =>
      !(source.layout?.interfaceGroup === parentGroup &&
        source.layout?.subinterfaceGroup === subGroupName)
    );

    updateConfig({ sources: updatedSources });

    // Remove from expansion state
    const key = `${parentGroup}::${subGroupName}`;
    const newExpanded = new Set(expandedSubGroups);
    newExpanded.delete(key);
    setExpandedSubGroups(newExpanded);

    toast({
      title: "Sub-Group Deleted",
      description: `"${subGroupName}" and its layers have been deleted.`,
    });
  };

  const handleUngroupSubGroup = (parentGroup: string, subGroupName: string) => {
    // Remove subinterfaceGroup property but keep layers
    const updatedSources = config.sources.map(source => {
      if (source.layout?.interfaceGroup === parentGroup &&
          source.layout?.subinterfaceGroup === subGroupName) {
        const { subinterfaceGroup, ...restLayout } = source.layout;
        return { ...source, layout: restLayout };
      }
      return source;
    });

    updateConfig({ sources: updatedSources });

    // Remove from expansion state
    const key = `${parentGroup}::${subGroupName}`;
    const newExpanded = new Set(expandedSubGroups);
    newExpanded.delete(key);
    setExpandedSubGroups(newExpanded);

    toast({
      title: "Layers Ungrouped",
      description: `Layers from "${subGroupName}" are now directly under "${parentGroup}".`,
    });
  };

  const handleMoveSubGroup = (parentGroup: string, subGroupName: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    // Get all sources in this parent group
    const groupSources = config.sources.map((source, idx) => ({ source, idx }))
      .filter(item => item.source.layout?.interfaceGroup === parentGroup && !item.source.isBaseLayer);
    
    // Get ordered list of sub-groups based on first appearance
    const orderedSubGroups: string[] = [];
    groupSources.forEach(({ source }) => {
      const subGroup = source.layout?.subinterfaceGroup;
      if (subGroup && !orderedSubGroups.includes(subGroup)) {
        orderedSubGroups.push(subGroup);
      }
    });
    
    const currentIndex = orderedSubGroups.indexOf(subGroupName);
    if (currentIndex === -1) return;
    
    let targetIndex: number;
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down') {
      targetIndex = currentIndex + 1;
    } else if (direction === 'top') {
      targetIndex = 0;
    } else {
      targetIndex = orderedSubGroups.length - 1;
    }
    
    if (targetIndex < 0 || targetIndex >= orderedSubGroups.length || targetIndex === currentIndex) return;
    
    // Get the target sub-group name
    const targetSubGroupName = orderedSubGroups[targetIndex];
    
    // Find the first source index of the target sub-group
    const targetFirstSourceIdx = groupSources.find(
      item => item.source.layout?.subinterfaceGroup === targetSubGroupName
    )?.idx;
    
    // Find all sources of the current sub-group
    const currentSubGroupSources = groupSources
      .filter(item => item.source.layout?.subinterfaceGroup === subGroupName)
      .map(item => item.idx);
    
    if (targetFirstSourceIdx === undefined || currentSubGroupSources.length === 0) return;
    
    // Reorder sources: move all current sub-group sources to before/after target
    const newSources = [...config.sources];
    
    // Remove current sub-group sources from their positions (in reverse to maintain indices)
    const removedSources: DataSource[] = [];
    [...currentSubGroupSources].reverse().forEach(idx => {
      removedSources.unshift(newSources.splice(idx, 1)[0]);
    });
    
    // Calculate new target position (adjusted for removed items)
    let insertPosition = targetFirstSourceIdx;
    currentSubGroupSources.forEach(idx => {
      if (idx < targetFirstSourceIdx) insertPosition--;
    });
    
    // If moving down, insert after the target sub-group's last item
    if (direction === 'down' || direction === 'bottom') {
      const targetSubGroupIndices = groupSources
        .filter(item => item.source.layout?.subinterfaceGroup === targetSubGroupName)
        .map(item => {
          let adjustedIdx = item.idx;
          currentSubGroupSources.forEach(removedIdx => {
            if (removedIdx < item.idx) adjustedIdx--;
          });
          return adjustedIdx;
        });
      insertPosition = Math.max(...targetSubGroupIndices) + 1;
    }
    
    // Insert the removed sources at the new position
    newSources.splice(insertPosition, 0, ...removedSources);
    
    updateConfig({ sources: newSources });
    
    toast({
      title: "Sub-Group Moved",
      description: `"${subGroupName}" has been moved ${direction}.`,
    });
  };

  // Handle sub-group drag reordering (when dropping one sub-group onto another)
  const handleReorderSubGroup = useCallback((parentGroup: string, fromSubGroupName: string, toSubGroupName: string) => {
    // Get all sources in this parent group
    const groupSources = config.sources.map((source, idx) => ({ source, idx }))
      .filter(item => item.source.layout?.interfaceGroup === parentGroup && !item.source.isBaseLayer);
    
    // Get ordered list of sub-groups based on first appearance
    const orderedSubGroups: string[] = [];
    groupSources.forEach(({ source }) => {
      const subGroup = source.layout?.subinterfaceGroup;
      if (subGroup && !orderedSubGroups.includes(subGroup)) {
        orderedSubGroups.push(subGroup);
      }
    });
    
    const fromIndex = orderedSubGroups.indexOf(fromSubGroupName);
    const toIndex = orderedSubGroups.indexOf(toSubGroupName);
    
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    
    // Find the first source index of the target sub-group
    const targetFirstSourceIdx = groupSources.find(
      item => item.source.layout?.subinterfaceGroup === toSubGroupName
    )?.idx;
    
    // Find all sources of the current sub-group
    const currentSubGroupSources = groupSources
      .filter(item => item.source.layout?.subinterfaceGroup === fromSubGroupName)
      .map(item => item.idx);
    
    if (targetFirstSourceIdx === undefined || currentSubGroupSources.length === 0) return;
    
    // Reorder sources: move all current sub-group sources to before/after target
    const newSources = [...config.sources];
    
    // Remove current sub-group sources from their positions (in reverse to maintain indices)
    const removedSources: DataSource[] = [];
    [...currentSubGroupSources].reverse().forEach(idx => {
      removedSources.unshift(newSources.splice(idx, 1)[0]);
    });
    
    // Calculate new target position (adjusted for removed items)
    let insertPosition = targetFirstSourceIdx;
    currentSubGroupSources.forEach(idx => {
      if (idx < targetFirstSourceIdx) insertPosition--;
    });
    
    // If moving down (fromIndex < toIndex), insert after the target sub-group's last item
    if (fromIndex < toIndex) {
      const targetSubGroupIndices = groupSources
        .filter(item => item.source.layout?.subinterfaceGroup === toSubGroupName)
        .map(item => {
          let adjustedIdx = item.idx;
          currentSubGroupSources.forEach(removedIdx => {
            if (removedIdx < item.idx) adjustedIdx--;
          });
          return adjustedIdx;
        });
      insertPosition = Math.max(...targetSubGroupIndices) + 1;
    }
    
    // Insert the removed sources at the new position
    newSources.splice(insertPosition, 0, ...removedSources);
    
    updateConfig({ sources: newSources });
    
    toast({
      title: "Sub-Group Reordered",
      description: `"${fromSubGroupName}" has been moved.`,
    });
  }, [config.sources, updateConfig, toast]);

  const toggleSubGroup = (parentGroup: string, subGroupName: string) => {
    const key = `${parentGroup}::${subGroupName}`;
    const newExpanded = new Set(expandedSubGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubGroups(newExpanded);

    // Notify parent of expansion state change
    if (onExpansionStateChange) {
      const groupsArray = Array.from(expandedGroups);
      if (expandedBaseLayers) groupsArray.push('__BASE_LAYERS__');
      if (expandedUngroupedLayers) groupsArray.push('__UNGROUPED__');

      const layersArray = Array.from(expandedLayers).map(idx => `layer-${idx}`);
      const subGroupsArray = Array.from(newExpanded);
      onExpansionStateChange(layersArray, groupsArray, subGroupsArray);
    }
  };

  // Handle expanding group after layer creation or data source addition
  useEffect(() => {
    if (expandedGroupAfterAction) {
      if (expandedGroupAfterAction === '__BASE_LAYERS__') {
        setExpandedBaseLayers(true);
      } else if (expandedGroupAfterAction === '__UNGROUPED__') {
        setExpandedUngroupedLayers(true);
      } else if (expandedGroupAfterAction.includes('::')) {
        // This is a sub-group key
        const newExpanded = new Set(expandedSubGroups);
        newExpanded.add(expandedGroupAfterAction);
        setExpandedSubGroups(newExpanded);
        // Also expand the parent group
        const [parentGroup] = expandedGroupAfterAction.split('::');
        const newGroupsExpanded = new Set(expandedGroups);
        newGroupsExpanded.add(parentGroup);
        setExpandedGroups(newGroupsExpanded);
      } else {
        // Regular interface group
        const newExpanded = new Set(expandedGroups);
        newExpanded.add(expandedGroupAfterAction);
        setExpandedGroups(newExpanded);
      }
      onClearExpandedGroup?.();
    }
  }, [expandedGroupAfterAction, expandedGroups, expandedSubGroups, onClearExpandedGroup]);

  // Notify parent when expanded layers change
  useEffect(() => {
    if (onExpansionStateChange) {
      const groupsArray = Array.from(expandedGroups);
      if (expandedBaseLayers) groupsArray.push('__BASE_LAYERS__');
      if (expandedUngroupedLayers) groupsArray.push('__UNGROUPED__');
      
      const layersArray = Array.from(expandedLayers).map(idx => `layer-${idx}`);
      const subGroupsArray = Array.from(expandedSubGroups);
      onExpansionStateChange(layersArray, groupsArray, subGroupsArray);
    }
  }, [expandedLayers, expandedGroups, expandedBaseLayers, expandedUngroupedLayers, expandedSubGroups, onExpansionStateChange]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
    
    // Notify parent of expansion state change
    if (onExpansionStateChange) {
      const groupsArray = Array.from(newExpanded);
      if (expandedBaseLayers) groupsArray.push('__BASE_LAYERS__');
      if (expandedUngroupedLayers) groupsArray.push('__UNGROUPED__');
      
      const layersArray = Array.from(expandedLayers).map(idx => `layer-${idx}`);
      const subGroupsArray = Array.from(expandedSubGroups);
      onExpansionStateChange(layersArray, groupsArray, subGroupsArray);
    }
  };

  const moveInterfaceGroup = (groupIndex: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    let newIndex: number;
    
    if (direction === 'top') {
      newIndex = 0;
    } else if (direction === 'bottom') {
      newIndex = config.interfaceGroups.length - 1;
    } else {
      newIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;
    }
    
    if (newIndex >= 0 && newIndex < config.interfaceGroups.length && newIndex !== groupIndex) {
      const updatedGroups = [...config.interfaceGroups];
      const [movedGroup] = updatedGroups.splice(groupIndex, 1);
      updatedGroups.splice(newIndex, 0, movedGroup);
      
      updateConfig({
        interfaceGroups: updatedGroups
      });
    }
  };

  const handleDeleteGroup = (groupName: string) => {
    setDeleteGroupName(groupName);
  };

  const handleConfirmDelete = () => {
    if (deleteGroupName) {
      const groupIndex = config.interfaceGroups.indexOf(deleteGroupName);
      if (groupIndex !== -1) {
        removeInterfaceGroup(groupIndex);
      }
      setDeleteGroupName(null);
    }
  };

  const handleMigrateAndDelete = (destinationGroup: string) => {
    if (deleteGroupName) {
      const groupIndex = config.interfaceGroups.indexOf(deleteGroupName);
      if (groupIndex !== -1) {
        migrateLayersAndRemoveGroup(groupIndex, destinationGroup);
      }
      setDeleteGroupName(null);
    }
  };

  // Group layers by interface group
  const groupedLayers = config.interfaceGroups.reduce((acc, group) => {
    acc[group] = [];
    return acc;
  }, {} as Record<string, Array<{ layer: DataSource; originalIndex: number }>>);

  const baseLayers: Array<{ layer: DataSource; originalIndex: number }> = [];
  const ungroupedLayers: Array<{ layer: DataSource; originalIndex: number }> = [];

  config.sources.forEach((source, index) => {
    const isBaseLayer = source.isBaseLayer === true;
    
    if (isBaseLayer) {
      baseLayers.push({ layer: source, originalIndex: index });
    } else {
      const group = source.layout?.interfaceGroup;
      if (group && groupedLayers[group]) {
        groupedLayers[group].push({ layer: source, originalIndex: index });
      } else {
        ungroupedLayers.push({ layer: source, originalIndex: index });
      }
    }
  });

  const currentGroupLayerCount = deleteGroupName ? 
    getLayerCountsByGroup().find(g => g.groupName === deleteGroupName)?.layerCount || 0 : 0;
  const currentMigrationOptions = deleteGroupName ? 
    getMigrationOptions(deleteGroupName) : [];

  // Helper to get expanded sub-groups for a specific interface group
  const getExpandedSubGroupsForGroup = (groupName: string): Set<string> => {
    const prefix = `${groupName}::`;
    const filtered = Array.from(expandedSubGroups)
      .filter(key => key.startsWith(prefix))
      .map(key => key.substring(prefix.length));
    return new Set(filtered);
  };

  // Handle moving a layer to a different group via drag-and-drop (appends to end)
  const handleMoveLayerToGroup = useCallback((
    layerIndex: number,
    newInterfaceGroup: string,
    newSubinterfaceGroup?: string
  ) => {
    const updatedSources = config.sources.map((source, idx) => {
      if (idx === layerIndex) {
        return {
          ...source,
          layout: {
            ...source.layout,
            interfaceGroup: newInterfaceGroup,
            subinterfaceGroup: newSubinterfaceGroup || undefined,
          },
        };
      }
      return source;
    });
    updateConfig({ sources: updatedSources });
    
    toast({
      title: "Layer Moved",
      description: `Layer moved to "${newInterfaceGroup}"${newSubinterfaceGroup ? ` → ${newSubinterfaceGroup}` : ''}.`,
    });
  }, [config.sources, updateConfig, toast]);

  // Handle moving a layer to a different group AND positioning it at a specific index
  const handleMoveLayerToPosition = useCallback((
    layerIndex: number,
    newInterfaceGroup: string,
    newSubinterfaceGroup: string | undefined,
    targetIndex: number
  ) => {
    // First, update the layer's group membership
    const layerToMove = {
      ...config.sources[layerIndex],
      layout: {
        ...config.sources[layerIndex].layout,
        interfaceGroup: newInterfaceGroup,
        subinterfaceGroup: newSubinterfaceGroup,
      },
    };
    
    // Remove from original position and insert at target position
    const newSources = [...config.sources];
    newSources.splice(layerIndex, 1);
    
    // Adjust target index if we removed from before the target
    const adjustedTargetIndex = layerIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newSources.splice(adjustedTargetIndex, 0, layerToMove);
    
    updateConfig({ sources: newSources });
    
    toast({
      title: "Layer Moved",
      description: `Layer moved to "${newInterfaceGroup}"${newSubinterfaceGroup ? ` → ${newSubinterfaceGroup}` : ''}.`,
    });
  }, [config.sources, updateConfig, toast]);

  // Handle reordering interface groups via drag
  const handleReorderInterfaceGroup = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updatedGroups = [...config.interfaceGroups];
    const [movedGroup] = updatedGroups.splice(fromIndex, 1);
    updatedGroups.splice(toIndex, 0, movedGroup);
    updateConfig({ interfaceGroups: updatedGroups });
  }, [config.interfaceGroups, updateConfig]);

  return (
    <LayerDndProvider
      sources={config.sources}
      interfaceGroups={config.interfaceGroups}
      onMoveLayerToGroup={handleMoveLayerToGroup}
      onMoveLayerToPosition={handleMoveLayerToPosition}
      onReorderLayer={onMoveLayer}
      onReorderInterfaceGroup={handleReorderInterfaceGroup}
      onReorderSubGroup={handleReorderSubGroup}
    >
      <div className="space-y-6">
        {/* Interface Groups - wrapped in SortableContext for drag reordering */}
        <SortableContext
          items={config.interfaceGroups.map(g => `interface-group-${g}`)}
          strategy={verticalListSortingStrategy}
        >
          {config.interfaceGroups.map((groupName, groupIndex) => (
            <SortableInterfaceGroup
              key={groupName}
              id={`interface-group-${groupName}`}
              groupName={groupName}
              groupIndex={groupIndex}
            >
              <LayerGroup
                groupName={groupName}
                groupIndex={groupIndex}
                sources={groupedLayers[groupName] ? groupedLayers[groupName].map(item => item.layer) : []}
                sourceIndices={groupedLayers[groupName] ? groupedLayers[groupName].map(item => item.originalIndex) : []}
                expandedLayers={expandedLayers}
                onToggleLayer={onToggleLayer}
                onRemoveInterfaceGroup={handleDeleteGroup}
                onAddLayer={(gName, subGName) => onAddLayer(gName, subGName)}
                onMoveGroup={moveInterfaceGroup}
                onRenameGroup={handleGroupRename}
                isExpanded={expandedGroups.has(groupName)}
                onToggleGroup={() => toggleGroup(groupName)}
                canMoveUp={groupIndex > 0}
                canMoveDown={groupIndex < config.interfaceGroups.length - 1}
                // Sub-group management
                onAddSubGroup={(subGroupName, selectedLayerIndices) => handleAddSubGroup(groupName, subGroupName, selectedLayerIndices)}
                onRenameSubGroup={(oldName, newName) => handleRenameSubGroup(groupName, oldName, newName)}
                onRemoveSubGroup={(subGroupName) => handleRemoveSubGroup(groupName, subGroupName)}
                onUngroupSubGroup={(subGroupName) => handleUngroupSubGroup(groupName, subGroupName)}
                onMoveSubGroup={(subGroupName, direction) => handleMoveSubGroup(groupName, subGroupName, direction)}
                expandedSubGroups={getExpandedSubGroupsForGroup(groupName)}
                onToggleSubGroup={(subGroupName) => toggleSubGroup(groupName, subGroupName)}
              />
            </SortableInterfaceGroup>
          ))}
        </SortableContext>

        {/* Base Layers */}
        <BaseLayerGroup
          baseLayers={baseLayers}
          isExpanded={expandedBaseLayers}
          onToggle={() => {
            const newExpanded = !expandedBaseLayers;
            setExpandedBaseLayers(newExpanded);
            
            // Notify parent of expansion state change
            if (onExpansionStateChange) {
              const groupsArray = Array.from(expandedGroups);
              if (newExpanded) groupsArray.push('__BASE_LAYERS__');
              if (expandedUngroupedLayers) groupsArray.push('__UNGROUPED__');
              
              const layersArray = Array.from(expandedLayers).map(idx => `layer-${idx}`);
              const subGroupsArray = Array.from(expandedSubGroups);
              onExpansionStateChange(layersArray, groupsArray, subGroupsArray);
            }
          }}
          onRemove={onRemove}
          onEdit={onEdit}
          onEditBaseLayer={onEditBaseLayer}
          onDuplicate={onDuplicate}
          onUpdateLayer={onUpdateLayer}
          onAddDataSource={onAddDataSource}
          onRemoveDataSource={onRemoveDataSource}
          onRemoveStatisticsSource={onRemoveStatisticsSource}
          onEditDataSource={onEditDataSource}
          onEditStatisticsSource={onEditStatisticsSource}
          onAddStatisticsSource={onAddStatisticsSource}
          onAddConstraintSource={onAddConstraintSource}
          onRemoveConstraintSource={onRemoveConstraintSource}
          onEditConstraintSource={onEditConstraintSource}
          onMoveConstraintUp={onMoveConstraintUp}
          onMoveConstraintDown={onMoveConstraintDown}
          onMoveConstraintToTop={onMoveConstraintToTop}
          onMoveConstraintToBottom={onMoveConstraintToBottom}
          onMoveLayer={onMoveLayer}
          onAddBaseLayer={onAddBaseLayer}
          onAddRecommendedBaseLayers={onAddRecommendedBaseLayers}
          isLoadingRecommended={isLoadingRecommended}
        />

        {/* Ungrouped Layers - moved to the end */}
        {ungroupedLayers.length > 0 && (
          <UngroupedLayersGroup
            ungroupedLayers={ungroupedLayers}
            onRemove={onRemove}
            onEdit={onEdit}
            onEditBaseLayer={onEditBaseLayer}
            onDuplicate={onDuplicate}
            onUpdateLayer={onUpdateLayer}
            onAddDataSource={onAddDataSource}
            onRemoveDataSource={onRemoveDataSource}
            onRemoveStatisticsSource={onRemoveStatisticsSource}
            onEditDataSource={onEditDataSource}
            onEditStatisticsSource={onEditStatisticsSource}
            onAddStatisticsSource={onAddStatisticsSource}
            onAddConstraintSource={onAddConstraintSource}
            onRemoveConstraintSource={onRemoveConstraintSource}
            onEditConstraintSource={onEditConstraintSource}
            onMoveConstraintUp={onMoveConstraintUp}
            onMoveConstraintDown={onMoveConstraintDown}
            onMoveConstraintToTop={onMoveConstraintToTop}
            onMoveConstraintToBottom={onMoveConstraintToBottom}
            isExpanded={expandedUngroupedLayers}
            onToggle={() => {
              const newExpanded = !expandedUngroupedLayers;
              setExpandedUngroupedLayers(newExpanded);
              
              // Notify parent of expansion state change
              if (onExpansionStateChange) {
                const groupsArray = Array.from(expandedGroups);
                if (expandedBaseLayers) groupsArray.push('__BASE_LAYERS__');
                if (newExpanded) groupsArray.push('__UNGROUPED__');
                
                const layersArray = Array.from(expandedLayers).map(idx => `layer-${idx}`);
                const subGroupsArray = Array.from(expandedSubGroups);
                onExpansionStateChange(layersArray, groupsArray, subGroupsArray);
              }
            }}
          />
        )}

        {/* Add Group Dialog */}
        <AddInterfaceGroupDialog
          open={showAddGroupDialog}
          onOpenChange={setShowAddGroupDialog}
          onAdd={addInterfaceGroup}
          existingGroups={config.interfaceGroups}
        />

        {/* Delete Group Dialog */}
        <DeleteInterfaceGroupDialog
          open={!!deleteGroupName}
          onOpenChange={(open) => !open && setDeleteGroupName(null)}
          groupName={deleteGroupName || ''}
          layerCount={currentGroupLayerCount}
          migrationOptions={currentMigrationOptions}
          onDelete={handleConfirmDelete}
          onMigrateAndDelete={handleMigrateAndDelete}
        />
      </div>
    </LayerDndProvider>
  );
};

export default LayerHierarchy;
