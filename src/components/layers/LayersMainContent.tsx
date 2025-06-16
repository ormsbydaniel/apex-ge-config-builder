
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
  handleAddInterfaceGroup: (groupName: string) => void;
  handleAddLayerForGroup: (groupName: string) => void;
}

interface LayersMainContentProps {
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
  layersLogic: LayersLogic;
}

const LayersMainContent = ({
  addExclusivitySet,
  removeExclusivitySet,
  newExclusivitySet,
  setNewExclusivitySet,
  layersLogic
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
        onRemove={() => {}} // Will be handled by context
        onEdit={() => {}} // Will be handled by context
        onEditBaseLayer={() => {}} // Will be handled by context
        onDuplicate={() => {}} // Will be handled by context
        onAddDataSource={() => {}} // Will be handled by context
        onRemoveDataSource={() => {}} // Will be handled by context
        onRemoveStatisticsSource={() => {}} // Will be handled by context
        onEditDataSource={() => {}} // Will be handled by context
        onEditStatisticsSource={() => {}} // Will be handled by context
        onMoveLayer={() => {}} // Will be handled by context
        onAddLayer={layersLogic.handleAddLayerForGroup}
        onAddBaseLayer={layersLogic.handleAddBaseLayer}
        updateConfig={() => {}} // Will be handled by context
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
