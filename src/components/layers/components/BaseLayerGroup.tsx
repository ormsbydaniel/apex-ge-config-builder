
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import LayerMoveControls from './LayerMoveControls';
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
  onMoveLayer: (fromOriginalIndex: number, toOriginalIndex: number) => void;
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

  const moveBaseLayer = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= baseLayers.length) {
      return;
    }

    const fromOriginalIndex = baseLayers[fromIndex].originalIndex;
    const toOriginalIndex = baseLayers[toIndex].originalIndex;
    
    onMoveLayer(fromOriginalIndex, toOriginalIndex);
  };

  return (
    <Card className="border-green-200">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-green-700" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-green-700" />
                )}
                <CardTitle className="text-lg text-green-700">Base Layers</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {baseLayers.length} layers
                </Badge>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Button 
                  onClick={onAddBaseLayer} 
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Base Layer
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {baseLayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No base layers yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {baseLayers.map(({ layer, originalIndex }, baseIndex) => (
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
                          onUpdateLayer={onUpdateLayer}
                          onAddDataSource={() => onAddDataSource(originalIndex)}
                          onRemoveDataSource={(dataSourceIndex) => onRemoveDataSource(originalIndex, dataSourceIndex)}
                          onRemoveStatisticsSource={(statsIndex) => onRemoveStatisticsSource(originalIndex, statsIndex)}
                          onEditDataSource={(dataIndex) => onEditDataSource(originalIndex, dataIndex)}
                          onEditStatisticsSource={(statsIndex) => onEditStatisticsSource(originalIndex, statsIndex)}
                          isExpanded={isCardExpanded(`base-${originalIndex}`)}
                          onToggle={() => toggleCard(`base-${originalIndex}`)}
                        />
                      </div>
                      <div className="flex-shrink-0 pt-4">
                        <LayerMoveControls
                          onMoveUp={() => moveBaseLayer(baseIndex, 'up')}
                          onMoveDown={() => moveBaseLayer(baseIndex, 'down')}
                          canMoveUp={baseIndex > 0}
                          canMoveDown={baseIndex < baseLayers.length - 1}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BaseLayerGroup;
