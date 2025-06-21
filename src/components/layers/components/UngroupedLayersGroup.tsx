
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import { useLayerCardState } from '@/hooks/useLayerCardState';

interface UngroupedLayersGroupProps {
  ungroupedLayers: Array<{ layer: DataSource; originalIndex: number }>;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onEditBaseLayer: (index: number) => void;
  onDuplicate: (index: number) => void;
  onUpdateLayer: (index: number, layer: DataSource) => void;
  onAddDataSource: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataSourceIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const UngroupedLayersGroup = ({
  ungroupedLayers,
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
  isExpanded = false,
  onToggle
}: UngroupedLayersGroupProps) => {
  const { toggleCard, isExpanded: isCardExpanded } = useLayerCardState();

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="border-amber-200">
        <CardHeader className="pb-4">
          <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 -mr-2">
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-left">
              <CardTitle className="text-amber-700 text-base font-semibold">
                Ungrouped Layers ({ungroupedLayers.length})
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                These layers don't belong to any interface group.
              </CardDescription>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
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
                  onUpdateLayer={onUpdateLayer}
                  onAddDataSource={() => onAddDataSource(originalIndex)}
                  onRemoveDataSource={(dataSourceIndex) => onRemoveDataSource(originalIndex, dataSourceIndex)}
                  onRemoveStatisticsSource={(statsIndex) => onRemoveStatisticsSource(originalIndex, statsIndex)}
                  onEditDataSource={(dataIndex) => onEditDataSource(originalIndex, dataIndex)}
                  onEditStatisticsSource={(statsIndex) => onEditStatisticsSource(originalIndex, statsIndex)}
                  isExpanded={isCardExpanded(`ungrouped-${originalIndex}`)}
                  onToggle={() => toggleCard(`ungrouped-${originalIndex}`)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default UngroupedLayersGroup;
