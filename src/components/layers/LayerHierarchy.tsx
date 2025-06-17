
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
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onAddLayer: (groupName: string) => void;
  onAddBaseLayer: () => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  expandedLayerAfterCreation?: string | null;
  expandedGroupAfterAction?: string | null;
  onClearExpandedLayer?: () => void;
  onClearExpandedGroup?: () => void;
}

const LayerHierarchy = ({
  config,
  onRemove,
  onEdit,
  onEditBaseLayer,
  onDuplicate,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onMoveLayer,
  onAddLayer,
  onAddBaseLayer,
  updateConfig,
  expandedLayerAfterCreation,
  expandedGroupAfterAction,
  onClearExpandedLayer,
  onClearExpandedGroup
}: LayerHierarchyProps) => {
  // Default all groups to collapsed
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedBaseLayers, setExpandedBaseLayers] = useState(false);
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

  // Handle expanding group after layer creation or data source addition
  useEffect(() => {
    if (expandedGroupAfterAction) {
      const newExpanded = new Set(expandedGroups);
      newExpanded.add(expandedGroupAfterAction);
      setExpandedGroups(newExpanded);
      onClearExpandedGroup?.();
    }
  }, [expandedGroupAfterAction, expandedGroups, onClearExpandedGroup]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleEditGroup = (groupName: string, newName: string): boolean => {
    const groupIndex = config.interfaceGroups.indexOf(groupName);
    if (groupIndex !== -1) {
      startRename(groupIndex);
      setEditingValue(newName);
      return confirmRename();
    }
    return false;
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

  const moveInterfaceGroup = (groupIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;
    if (newIndex >= 0 && newIndex < config.interfaceGroups.length) {
      const updatedGroups = [...config.interfaceGroups];
      const [movedGroup] = updatedGroups.splice(groupIndex, 1);
      updatedGroups.splice(newIndex, 0, movedGroup);
      
      updateConfig({
        interfaceGroups: updatedGroups
      });
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
    // Enhanced debugging for base layer detection
    const isBaseLayer = source.isBaseLayer === true;
    console.log(`Layer "${source.name}" (index ${index}):`, {
      isBaseLayer: source.isBaseLayer,
      isBaseLayerStrict: isBaseLayer,
      hasLayout: !!source.layout,
      interfaceGroup: source.layout?.interfaceGroup
    });
    
    if (isBaseLayer) {
      console.log(`Adding "${source.name}" to baseLayers`);
      baseLayers.push({ layer: source, originalIndex: index });
    } else {
      const group = source.layout?.interfaceGroup;
      if (group && groupedLayers[group]) {
        console.log(`Adding "${source.name}" to group "${group}"`);
        groupedLayers[group].push({ layer: source, originalIndex: index });
      } else {
        console.log(`Adding "${source.name}" to ungroupedLayers`);
        ungroupedLayers.push({ layer: source, originalIndex: index });
      }
    }
  });

  // Debug output for final categorization
  console.log('Final layer categorization:', {
    baseLayers: baseLayers.map(b => b.layer.name),
    ungroupedLayers: ungroupedLayers.map(u => u.layer.name),
    groupedLayers: Object.entries(groupedLayers).reduce((acc, [group, layers]) => {
      acc[group] = layers.map(l => l.layer.name);
      return acc;
    }, {} as Record<string, string[]>)
  });

  const currentGroupLayerCount = deleteGroupName ? 
    getLayerCountsByGroup().find(g => g.groupName === deleteGroupName)?.layerCount || 0 : 0;
  const currentMigrationOptions = deleteGroupName ? 
    getMigrationOptions(deleteGroupName) : [];

  return (
    <div className="space-y-6">
      {/* Interface Groups - Always show all groups, even empty ones */}
      {config.interfaceGroups.map((groupName, groupIndex) => (
        <LayerGroup
          key={groupName}
          groupName={groupName}
          layers={groupedLayers[groupName] || []}
          isExpanded={expandedGroups.has(groupName)}
          onToggle={() => toggleGroup(groupName)}
          onRemove={onRemove}
          onEdit={onEdit}
          onEditBaseLayer={onEditBaseLayer}
          onDuplicate={onDuplicate}
          onAddDataSource={onAddDataSource}
          onRemoveDataSource={onRemoveDataSource}
          onRemoveStatisticsSource={onRemoveStatisticsSource}
          onEditDataSource={onEditDataSource}
          onEditStatisticsSource={onEditStatisticsSource}
          onMoveLayer={onMoveLayer}
          onAddLayer={() => onAddLayer(groupName)}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          expandedLayerAfterCreation={expandedLayerAfterCreation}
          onClearExpandedLayer={onClearExpandedLayer}
          onMoveGroup={(direction) => moveInterfaceGroup(groupIndex, direction)}
          canMoveGroupUp={groupIndex > 0}
          canMoveGroupDown={groupIndex < config.interfaceGroups.length - 1}
        />
      ))}

      {/* Ungrouped Layers */}
      {ungroupedLayers.length > 0 && (
        <UngroupedLayersGroup
          ungroupedLayers={ungroupedLayers}
          onRemove={onRemove}
          onEdit={onEdit}
          onEditBaseLayer={onEditBaseLayer}
          onDuplicate={onDuplicate}
          onAddDataSource={onAddDataSource}
          onRemoveDataSource={onRemoveDataSource}
          onRemoveStatisticsSource={onRemoveStatisticsSource}
          onEditDataSource={onEditDataSource}
          onEditStatisticsSource={onEditStatisticsSource}
        />
      )}

      {/* Base Layers - Always show even if empty */}
      <BaseLayerGroup
        baseLayers={baseLayers}
        isExpanded={expandedBaseLayers}
        onToggle={() => setExpandedBaseLayers(!expandedBaseLayers)}
        onRemove={onRemove}
        onEdit={onEdit}
        onEditBaseLayer={onEditBaseLayer}
        onDuplicate={onDuplicate}
        onAddDataSource={onAddDataSource}
        onRemoveDataSource={onRemoveDataSource}
        onRemoveStatisticsSource={onRemoveStatisticsSource}
        onEditDataSource={onEditDataSource}
        onEditStatisticsSource={onEditStatisticsSource}
        onMoveLayer={onMoveLayer}
        onAddBaseLayer={onAddBaseLayer}
      />

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
