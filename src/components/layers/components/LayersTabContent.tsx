
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
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onAddLayer: (groupName: string) => void;
  onAddBaseLayer: () => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[] }) => void;
  expandedLayerAfterCreation: string | null;
  expandedGroupAfterAction: string | null;
  onClearExpandedLayer: () => void;
  onClearExpandedGroup: () => void;
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
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
  onMoveLayer,
  onAddLayer,
  onAddBaseLayer,
  updateConfig,
  expandedLayerAfterCreation,
  expandedGroupAfterAction,
  onClearExpandedLayer,
  onClearExpandedGroup,
  expandedLayers,
  onToggleLayer,
  onUpdateLayer
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
            onMoveLayer={onMoveLayer}
            onAddLayer={onAddLayer}
            onAddBaseLayer={onAddBaseLayer}
            updateConfig={updateConfig}
            expandedLayerAfterCreation={expandedLayerAfterCreation}
            expandedGroupAfterAction={expandedGroupAfterAction}
            onClearExpandedLayer={onClearExpandedLayer}
            onClearExpandedGroup={onClearExpandedGroup}
            expandedLayers={expandedLayers}
            onToggleLayer={onToggleLayer}
            onUpdateLayer={onUpdateLayer}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LayersTabContent;
