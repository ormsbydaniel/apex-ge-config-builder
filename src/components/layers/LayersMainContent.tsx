
import React from 'react';
import LayersTabContent from './components/LayersTabContent';
import ExclusivitySetsSection from './components/ExclusivitySetsSection';
import AddInterfaceGroupDialog from './components/AddInterfaceGroupDialog';
import { useLayersTabContext } from '@/contexts/LayersTabContext';

interface LayersMainContentProps {
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
  layersLogic: any;
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
}

const LayersMainContent = ({
  addExclusivitySet,
  removeExclusivitySet,
  newExclusivitySet,
  setNewExclusivitySet,
  layersLogic,
  expandedLayers,
  onToggleLayer
}: LayersMainContentProps) => {
  const {
    config,
    onRemoveLayer,
    onEditLayer,
    onEditBaseLayer,
    onDuplicateLayer,
    onMoveLayer,
    onUpdateConfig,
    onUpdateLayer,
    onAddDataSource,
    onRemoveDataSource,
    onRemoveStatisticsSource,
    onEditDataSource,
    onEditStatisticsSource
  } = useLayersTabContext();

  // Debug: Check what config is received from context
  console.log('LayersMainContent: config.sources from context:', config.sources.map(s => ({ 
    name: s.name, 
    meta: s.meta, 
    colormaps: s.meta?.colormaps 
  })));

  return (
    <div className="space-y-6">
      <LayersTabContent
        config={config}
        onAddGroup={() => layersLogic.setShowAddGroupDialog(true)}
        onRemove={onRemoveLayer}
        onEdit={onEditLayer}
        onEditBaseLayer={onEditBaseLayer}
        onDuplicate={onDuplicateLayer}
        onAddDataSource={onAddDataSource}
        onRemoveDataSource={onRemoveDataSource}
        onRemoveStatisticsSource={onRemoveStatisticsSource}
        onEditDataSource={onEditDataSource}
        onEditStatisticsSource={onEditStatisticsSource}
        onMoveLayer={onMoveLayer}
        onAddLayer={layersLogic.handleAddLayerForGroup || (() => {})}
        onAddBaseLayer={layersLogic.handleAddBaseLayer}
        updateConfig={onUpdateConfig}
        expandedLayerAfterCreation={layersLogic.expandedLayerAfterCreation}
        expandedLayerAfterEdit={layersLogic.expandedLayerAfterEdit}
        expandedGroupAfterAction={layersLogic.expandedGroupAfterAction}
        onClearExpandedLayer={layersLogic.clearExpandedLayerAfterCreation}
        onClearExpandedLayerAfterEdit={layersLogic.clearExpandedLayerAfterEdit}
        onClearExpandedGroup={layersLogic.clearExpandedGroup}
        expandedLayers={expandedLayers}
        onToggleLayer={onToggleLayer}
        onUpdateLayer={onUpdateLayer}
      />

      <ExclusivitySetsSection
        exclusivitySets={config.exclusivitySets}
        newExclusivitySet={newExclusivitySet}
        onNewExclusivitySetChange={setNewExclusivitySet}
        onAddExclusivitySet={addExclusivitySet}
        onRemoveExclusivitySet={removeExclusivitySet}
      />

      <AddInterfaceGroupDialog
        open={layersLogic.showAddGroupDialog}
        onOpenChange={layersLogic.setShowAddGroupDialog}
        onAdd={layersLogic.handleAddInterfaceGroup}
        existingGroups={config.interfaceGroups}
      />
    </div>
  );
};

export default LayersMainContent;
