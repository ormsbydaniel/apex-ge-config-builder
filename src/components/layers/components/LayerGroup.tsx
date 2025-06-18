
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import { useLayersTabContext } from '@/contexts/LayersTabContext';
import LayerCard from '../LayerCard';

interface LayerGroupProps {
  groupName: string;
  groupIndex: number;
  sources: DataSource[];
  sourceIndices: number[];
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  onRemoveInterfaceGroup: (groupName: string) => void;
  onAddLayer: (groupName: string) => void;
  onMoveGroup: (groupIndex: number, direction: 'up' | 'down') => void;
  isExpanded: boolean;
  onToggleGroup: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const LayerGroup = ({ 
  groupName, 
  groupIndex,
  sources, 
  sourceIndices, 
  expandedLayers, 
  onToggleLayer,
  onRemoveInterfaceGroup,
  onAddLayer,
  onMoveGroup,
  isExpanded,
  onToggleGroup,
  canMoveUp,
  canMoveDown
}: LayerGroupProps) => {
  const {
    onRemoveLayer,
    onEditLayer,
    onEditBaseLayer,
    onDuplicateLayer,
    onUpdateLayer,
    onAddDataSource,
    onRemoveDataSource,
    onRemoveStatisticsSource,
    onEditDataSource,
    onEditStatisticsSource,
    onMoveLayer
  } = useLayersTabContext();

  const handleMoveLayerInGroup = (fromIndex: number, direction: 'up' | 'down') => {
    const currentGroupSources = sourceIndices;
    const fromPosition = currentGroupSources.indexOf(fromIndex);
    
    if (fromPosition === -1) return;
    
    const toPosition = direction === 'up' ? fromPosition - 1 : fromPosition + 1;
    
    if (toPosition < 0 || toPosition >= currentGroupSources.length) return;
    
    const toIndex = currentGroupSources[toPosition];
    onMoveLayer(fromIndex, toIndex);
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <Card className="border-primary/20">
          <Collapsible open={isExpanded} onOpenChange={onToggleGroup}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-primary">{groupName}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {sources.length} layer{sources.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddLayer(groupName)}
                    className="text-primary hover:bg-primary/10 border-primary/30"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Layer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveInterfaceGroup(groupName)}
                    className="text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {sources.map((source, idx) => {
                    const actualIndex = sourceIndices[idx];
                    return (
                      <div key={actualIndex} className="flex items-start gap-2">
                        <div className="flex-1">
                          <LayerCard
                            source={source}
                            index={actualIndex}
                            onRemove={onRemoveLayer}
                            onEdit={onEditLayer}
                            onEditBaseLayer={onEditBaseLayer}
                            onDuplicate={onDuplicateLayer}
                            onUpdateLayer={onUpdateLayer}
                            onAddDataSource={() => onAddDataSource(actualIndex)}
                            onRemoveDataSource={(dataSourceIndex) => onRemoveDataSource(actualIndex, dataSourceIndex)}
                            onRemoveStatisticsSource={(statsIndex) => onRemoveStatisticsSource(actualIndex, statsIndex)}
                            onEditDataSource={(dataIndex) => onEditDataSource(actualIndex, dataIndex)}
                            onEditStatisticsSource={(statsIndex) => onEditStatisticsSource(actualIndex, statsIndex)}
                            isExpanded={expandedLayers.has(actualIndex)}
                            onToggle={() => onToggleLayer(actualIndex)}
                          />
                        </div>
                        <div className="flex flex-col gap-1 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveLayerInGroup(actualIndex, 'up')}
                            disabled={idx === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveLayerInGroup(actualIndex, 'down')}
                            disabled={idx === sources.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
      
      {/* Group move controls positioned in the space between card and panel edge */}
      <div className="flex flex-col gap-1 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMoveGroup(groupIndex, 'up')}
          disabled={!canMoveUp}
          className="h-6 w-6 p-0"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMoveGroup(groupIndex, 'down')}
          disabled={!canMoveDown}
          className="h-6 w-6 p-0"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default LayerGroup;
