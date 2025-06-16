
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import GroupHeader from './GroupHeader';
import LayerList from './LayerList';
import GroupMoveControls from './GroupMoveControls';
import { useLayerCardState } from '@/hooks/useLayerCardState';

interface LayerGroupProps {
  groupName: string;
  layers: Array<{ layer: DataSource; originalIndex: number }>;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onMoveLayer: (fromOriginalIndex: number, toOriginalIndex: number) => void;
  onAddLayer: () => void;
  onEditGroup?: (groupName: string, newName: string) => boolean;
  onDeleteGroup?: (groupName: string) => void;
  expandedLayerAfterCreation?: string | null;
  onClearExpandedLayer?: () => void;
  onMoveGroup?: (direction: 'up' | 'down') => void;
  canMoveGroupUp?: boolean;
  canMoveGroupDown?: boolean;
}

const LayerGroup = ({
  groupName,
  layers,
  isExpanded,
  onToggle,
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
  onEditGroup,
  onDeleteGroup,
  expandedLayerAfterCreation,
  onClearExpandedLayer,
  onMoveGroup,
  canMoveGroupUp = false,
  canMoveGroupDown = false
}: LayerGroupProps) => {
  const { toggleCard, isExpanded: isCardExpanded } = useLayerCardState();

  // Handle expanding layer card after creation
  useEffect(() => {
    if (expandedLayerAfterCreation && expandedLayerAfterCreation.startsWith(`${groupName}-`)) {
      toggleCard(expandedLayerAfterCreation);
      onClearExpandedLayer?.();
    }
  }, [expandedLayerAfterCreation, groupName, toggleCard, onClearExpandedLayer]);

  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <Card className="border-primary/20">
          <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
              <GroupHeader
                groupName={groupName}
                layerCount={layers.length}
                isExpanded={isExpanded}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
                onAddLayer={onAddLayer}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <LayerList
                layers={layers}
                groupName={groupName}
                isCardExpanded={isCardExpanded}
                toggleCard={toggleCard}
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
              />
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
      
      <GroupMoveControls
        onMoveGroup={onMoveGroup}
        canMoveGroupUp={canMoveGroupUp}
        canMoveGroupDown={canMoveGroupDown}
      />
    </div>
  );
};

export default LayerGroup;
