
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import LayerMoveControls from './LayerMoveControls';

interface LayerListProps {
  layers: Array<{ layer: DataSource; originalIndex: number }>;
  groupName: string;
  isCardExpanded: (cardId: string) => boolean;
  toggleCard: (cardId: string) => void;
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
}

const LayerList = ({
  layers,
  groupName,
  isCardExpanded,
  toggleCard,
  onRemove,
  onEdit,
  onEditBaseLayer,
  onDuplicate,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onMoveLayer
}: LayerListProps) => {
  const moveLayerWithinGroup = (fromGroupIndex: number, direction: 'up' | 'down') => {
    const toGroupIndex = direction === 'up' ? fromGroupIndex - 1 : fromGroupIndex + 1;
    
    if (toGroupIndex < 0 || toGroupIndex >= layers.length) {
      return;
    }

    const fromOriginalIndex = layers[fromGroupIndex].originalIndex;
    const toOriginalIndex = layers[toGroupIndex].originalIndex;
    
    onMoveLayer(fromOriginalIndex, toOriginalIndex);
  };

  if (layers.length === 0) {
    return (
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No layers in this group yet.</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <div className="space-y-4">
        {layers.map(({ layer, originalIndex }, groupIndex) => (
          <div key={originalIndex} className="relative">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <LayerCard
                  source={layer}
                  index={originalIndex}
                  onRemove={onRemove}
                  onEdit={onEdit}
                  onEditBaseLayer={onEditBaseLayer}
                  onDuplicate={onDuplicate}
                  onAddDataSource={() => onAddDataSource(originalIndex)}
                  onRemoveDataSource={(dataSourceIndex) => onRemoveDataSource(originalIndex, dataSourceIndex)}
                  onRemoveStatisticsSource={(statsIndex) => onRemoveStatisticsSource(originalIndex, statsIndex)}
                  onEditDataSource={(dataIndex) => onEditDataSource(originalIndex, dataIndex)}
                  onEditStatisticsSource={(statsIndex) => onEditStatisticsSource(originalIndex, statsIndex)}
                  isExpanded={isCardExpanded(`${groupName}-${originalIndex}`)}
                  onToggle={() => toggleCard(`${groupName}-${originalIndex}`)}
                />
              </div>
              <div className="flex-shrink-0 pt-4">
                <LayerMoveControls
                  onMoveUp={() => moveLayerWithinGroup(groupIndex, 'up')}
                  onMoveDown={() => moveLayerWithinGroup(groupIndex, 'down')}
                  canMoveUp={groupIndex > 0}
                  canMoveDown={groupIndex < layers.length - 1}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
};

export default LayerList;
