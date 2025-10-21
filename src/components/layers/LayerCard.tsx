
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import LayerCardHeader from './components/LayerCardHeader';
import LayerCardContent from './components/LayerCardContent';
import LayerJsonEditorDialog from './components/LayerJsonEditorDialog';

interface LayerCardProps {
  source: DataSource;
  index: number;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
  onAddStatisticsSource?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const LayerCard = ({ 
  source, 
  index, 
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
  isExpanded,
  onToggle
}: LayerCardProps) => {
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  
  const isBaseLayer = source.isBaseLayer === true;
  const isSwipeLayer = source.meta?.swipeConfig !== undefined || (source as any).isSwipeLayer;
  const isMirrorLayer = (source as any).isMirrorLayer;
  const isSpotlightLayer = (source as any).isSpotlightLayer;

  const handleEdit = () => {
    if (isBaseLayer) {
      onEditBaseLayer(index);
    } else {
      onEdit(index);
    }
  };

  const handleEditJson = () => {
    setIsJsonEditorOpen(true);
  };

  const handleJsonSave = (updatedLayer: DataSource) => {
    onUpdateLayer(index, updatedLayer);
    setIsJsonEditorOpen(false);
  };

  // Determine border color based on layer type
  const borderClass = isSwipeLayer 
    ? 'border-l-4 border-l-purple-500' 
    : isMirrorLayer
      ? 'border-l-4 border-l-blue-500'
      : isSpotlightLayer
        ? 'border-l-4 border-l-yellow-500'
        : isBaseLayer 
          ? 'border-l-4 border-l-green-500'
          : 'border-l-4 border-l-primary/30';

  return (
    <>
      <Card 
        className={borderClass}
        data-layer-index={index}
        data-card-id={`layer-${index}`}
        data-testid={`layer-card-${index}`}
      >
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <LayerCardHeader
            source={source}
            index={index}
            isExpanded={isExpanded}
            isSwipeLayer={isSwipeLayer}
            onRemove={onRemove}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onEditJson={handleEditJson}
            handleEdit={handleEdit}
          />
          <CollapsibleContent>
            <LayerCardContent
              source={source}
              onAddDataSource={onAddDataSource}
              onRemoveDataSource={onRemoveDataSource}
              onRemoveStatisticsSource={onRemoveStatisticsSource}
              onEditDataSource={onEditDataSource}
              onEditStatisticsSource={onEditStatisticsSource}
              onAddStatisticsSource={onAddStatisticsSource}
            />
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <LayerJsonEditorDialog
        isOpen={isJsonEditorOpen}
        onClose={() => setIsJsonEditorOpen(false)}
        layer={source}
        onSave={handleJsonSave}
      />
    </>
  );
};

export default LayerCard;
