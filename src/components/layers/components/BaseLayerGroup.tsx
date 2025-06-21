
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import { useLayerCardState } from '@/hooks/useLayerCardState';

interface BaseLayerGroupProps {
  baseLayers: Array<{ layer: DataSource; originalIndex: number }>;
  isExpanded: boolean;
  onToggle: () => void;
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
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onAddBaseLayer: () => void;
}

const BaseLayerGroup = ({
  baseLayers,
  isExpanded,
  onToggle,
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
  onMoveLayer,
  onAddBaseLayer
}: BaseLayerGroupProps) => {
  const { toggleCard, isExpanded: isCardExpanded } = useLayerCardState();

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-green-700">Base Layers</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {baseLayers.length} layer{baseLayers.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddBaseLayer}
                className="text-primary hover:bg-primary/10 border-primary/30"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Base Layer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {baseLayers.map(({ layer, originalIndex }) => (
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
                  isExpanded={isCardExpanded(`base-${originalIndex}`)}
                  onToggle={() => toggleCard(`base-${originalIndex}`)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default BaseLayerGroup;
