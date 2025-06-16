
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import { useLayerCardState } from '@/hooks/useLayerCardState';

interface UngroupedLayersGroupProps {
  ungroupedLayers: Array<{ layer: DataSource; originalIndex: number }>;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
}

const UngroupedLayersGroup = ({
  ungroupedLayers,
  onRemove,
  onEdit,
  onEditBaseLayer,
  onDuplicate,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource
}: UngroupedLayersGroupProps) => {
  const { toggleCard, isExpanded } = useLayerCardState();

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-amber-700">Ungrouped Layers</CardTitle>
        <CardDescription>
          These layers don't belong to any interface group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ungroupedLayers.map(({ layer, originalIndex }) => (
            <LayerCard
              key={originalIndex}
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
              isExpanded={isExpanded(`ungrouped-${originalIndex}`)}
              onToggle={() => toggleCard(`ungrouped-${originalIndex}`)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UngroupedLayersGroup;
