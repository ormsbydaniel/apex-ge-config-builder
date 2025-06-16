
import React from 'react';
import LayersTabContent from './components/LayersTabContent';
import ExclusivitySetsSection from './components/ExclusivitySetsSection';
import AddInterfaceGroupDialog from './components/AddInterfaceGroupDialog';
import LayersTabHeader from './components/LayersTabHeader';
import { useLayersTabContext } from '@/contexts/LayersTabContext';

interface LayersLogic {
  setShowAddGroupDialog: (show: boolean) => void;
  showAddGroupDialog: boolean;
  handleAddBaseLayer: () => void;
  expandedLayerAfterCreation: string | null;
  expandedGroupAfterAction: string | null;
  clearExpandedLayerAfterCreation: () => void;
  clearExpandedGroup: () => void;
  handleAddInterfaceGroup: (groupName: string) => boolean;
  handleAddLayerForGroup: (groupName: string) => void;
  handleEditLayer: (index: number) => void;
  handleEditBaseLayer: (index: number) => void;
  handleDuplicateLayer: (index: number) => void;
  handleRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  handleRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  handleEditDataSource: (layerIndex: number, dataIndex: number) => void;
  handleEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  handleStartDataSourceFormWithExpansion: (layerIndex: number) => void;
}

interface LayersMainContentProps {
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
  layersLogic: LayersLogic;
  removeLayer: (index: number) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
}

const LayersMainContent = ({
  addExclusivitySet,
  removeExclusivitySet,
  newExclusivitySet,
  setNewExclusivitySet,
  layersLogic,
  removeLayer,
  moveLayer,
  updateConfig
}: LayersMainContentProps) => {
  const { config } = useLayersTabContext();

  return (
    <div className="space-y-6">
      <LayersTabHeader
        onAddGroup={() => layersLogic.setShowAddGroupDialog(true)}
        onAddBaseLayer={layersLogic.handleAddBaseLayer}
      />

      <LayersTabContent
        config={config}
        onAddGroup={() => layersLogic.setShowAddGroupDialog(true)}
        onRemove={removeLayer}
        onEdit={layersLogic.handleEditLayer}
        onEditBaseLayer={layersLogic.handleEditBaseLayer}
        onDuplicate={layersLogic.handleDuplicateLayer}
        onAddDataSource={layersLogic.handleStartDataSourceFormWithExpansion}
        onRemoveDataSource={layersLogic.handleRemoveDataSource}
        onRemoveStatisticsSource={layersLogic.handleRemoveStatisticsSource}
        onEditDataSource={layersLogic.handleEditDataSource}
        onEditStatisticsSource={layersLogic.handleEditStatisticsSource}
        onMoveLayer={moveLayer}
        onAddLayer={layersLogic.handleAddLayerForGroup}
        onAddBaseLayer={layersLogic.handleAddBaseLayer}
        updateConfig={updateConfig}
        expandedLayerAfterCreation={layersLogic.expandedLayerAfterCreation}
        expandedGroupAfterAction={layersLogic.expandedGroupAfterAction}
        onClearExpandedLayer={layersLogic.clearExpandedLayerAfterCreation}
        onClearExpandedGroup={layersLogic.clearExpandedGroup}
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
