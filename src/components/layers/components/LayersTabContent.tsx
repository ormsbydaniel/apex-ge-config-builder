
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DataSource } from '@/types/config';
import LayerHierarchy from '../LayerHierarchy';
import EmptyLayersState from '../EmptyLayersState';
import LayersTabHeader from './LayersTabHeader';

interface LayersTabContentProps {
  config: {
    sources: DataSource[];
    interfaceGroups: string[];
  };
  onAddGroup: () => void;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onAddStatisticsSource: (layerIndex: number) => void;
  onAddConstraintSource?: (layerIndex: number) => void;
  onRemoveConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onEditConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onAddLayer: (groupName: string) => void;
  onAddBaseLayer: () => void;
  onAddRecommendedBaseLayers: () => void;
  isLoadingRecommended?: boolean;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  expandedLayerAfterCreation: string | null;
  expandedLayerAfterEdit?: string | null;
  expandedGroupAfterAction: string | null;
  onClearExpandedLayer: () => void;
  onClearExpandedLayerAfterEdit?: () => void;
  onClearExpandedGroup: () => void;
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onExpansionStateChange?: (layers: string[], groups: string[]) => void;
  navigationState?: { expandedGroups: string[]; expandedLayers: string[] };
}

const LayersTabContent = ({
  config,
  onAddGroup,
  onRemove,
  onEdit,
  onEditBaseLayer,
  onDuplicate,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onAddStatisticsSource,
  onAddConstraintSource,
  onRemoveConstraintSource,
  onEditConstraintSource,
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
  onUpdateLayer,
  onExpansionStateChange,
  navigationState
}: LayersTabContentProps) => {
  return (
    <Card className="border-primary/20">
      <LayersTabHeader 
        layerCount={config.sources.length}
        onAddGroup={onAddGroup}
      />
      <CardContent>
        {config.sources.length === 0 && config.interfaceGroups.length === 0 ? (
          <EmptyLayersState />
        ) : (
          <LayerHierarchy
            config={config}
            onRemove={onRemove}
            onEdit={onEdit}
            onEditBaseLayer={onEditBaseLayer}
            onDuplicate={onDuplicate}
            onAddDataSource={onAddDataSource}
            onRemoveDataSource={onRemoveDataSource}
            onRemoveStatisticsSource={onRemoveStatisticsSource}
            onEditDataSource={onEditDataSource}
            onEditStatisticsSource={onEditStatisticsSource}
            onAddStatisticsSource={onAddStatisticsSource}
            onAddConstraintSource={onAddConstraintSource}
            onRemoveConstraintSource={onRemoveConstraintSource}
            onEditConstraintSource={onEditConstraintSource}
            onMoveLayer={onMoveLayer}
            onAddLayer={onAddLayer}
            onAddBaseLayer={onAddBaseLayer}
            onAddRecommendedBaseLayers={onAddRecommendedBaseLayers}
            isLoadingRecommended={isLoadingRecommended}
            updateConfig={updateConfig}
            expandedLayerAfterCreation={expandedLayerAfterCreation}
            expandedLayerAfterEdit={expandedLayerAfterEdit}
            expandedGroupAfterAction={expandedGroupAfterAction}
            onClearExpandedLayer={onClearExpandedLayer}
            onClearExpandedLayerAfterEdit={onClearExpandedLayerAfterEdit}
            onClearExpandedGroup={onClearExpandedGroup}
            expandedLayers={expandedLayers}
            onToggleLayer={onToggleLayer}
            onUpdateLayer={onUpdateLayer}
            onExpansionStateChange={onExpansionStateChange}
            navigationState={navigationState}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LayersTabContent;
