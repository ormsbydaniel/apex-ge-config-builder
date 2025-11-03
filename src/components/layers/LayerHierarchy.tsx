import React, { useState, useEffect } from 'react';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import LayerGroup from './components/LayerGroup';
import BaseLayerGroup from './components/BaseLayerGroup';
import UngroupedLayersGroup from './components/UngroupedLayersGroup';
import AddInterfaceGroupDialog from './components/AddInterfaceGroupDialog';
import DeleteInterfaceGroupDialog from './components/DeleteInterfaceGroupDialog';
import { useInterfaceGroupManagement } from '@/hooks/useInterfaceGroupManagement';

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
  onAddLayer: (groupName: string) => void;
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
  onExpansionStateChange?: (layers: string[], groups: string[]) => void;
  navigationState?: { expandedGroups: string[]; expandedLayers: string[] };
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
  };

  // Handle expanding group after layer creation or data source addition
  useEffect(() => {
    if (expandedGroupAfterAction) {
      if (expandedGroupAfterAction === '__BASE_LAYERS__') {
        setExpandedBaseLayers(true);
      } else if (expandedGroupAfterAction === '__UNGROUPED__') {
        setExpandedUngroupedLayers(true);
      } else {
        // Regular interface group
        const newExpanded = new Set(expandedGroups);
        newExpanded.add(expandedGroupAfterAction);
        setExpandedGroups(newExpanded);
      }
      onClearExpandedGroup?.();
    }
  }, [expandedGroupAfterAction, expandedGroups, onClearExpandedGroup]);

  // Notify parent when expanded layers change
  useEffect(() => {
    if (onExpansionStateChange) {
      const groupsArray = Array.from(expandedGroups);
      if (expandedBaseLayers) groupsArray.push('__BASE_LAYERS__');
      if (expandedUngroupedLayers) groupsArray.push('__UNGROUPED__');
      
      const layersArray = Array.from(expandedLayers).map(idx => `layer-${idx}`);
      onExpansionStateChange(layersArray, groupsArray);
    }
  }, [expandedLayers, expandedGroups, expandedBaseLayers, expandedUngroupedLayers, onExpansionStateChange]);

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
      onExpansionStateChange(layersArray, groupsArray);
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

  return (
    <div className="space-y-6">
      {/* Interface Groups */}
      {config.interfaceGroups.map((groupName, groupIndex) => (
        <LayerGroup
          key={groupName}
          groupName={groupName}
          groupIndex={groupIndex}
          sources={groupedLayers[groupName] ? groupedLayers[groupName].map(item => item.layer) : []}
          sourceIndices={groupedLayers[groupName] ? groupedLayers[groupName].map(item => item.originalIndex) : []}
          expandedLayers={expandedLayers}
          onToggleLayer={onToggleLayer}
          onRemoveInterfaceGroup={handleDeleteGroup}
          onAddLayer={onAddLayer}
          onMoveGroup={moveInterfaceGroup}
          onRenameGroup={handleGroupRename}
          isExpanded={expandedGroups.has(groupName)}
          onToggleGroup={() => toggleGroup(groupName)}
          canMoveUp={groupIndex > 0}
          canMoveDown={groupIndex < config.interfaceGroups.length - 1}
        />
      ))}

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
            onExpansionStateChange(layersArray, groupsArray);
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
              onExpansionStateChange(layersArray, groupsArray);
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
  );
};

export default LayerHierarchy;
