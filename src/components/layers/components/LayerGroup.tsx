import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import LayerCard from '../LayerCard';
import LayerMoveControls from './LayerMoveControls';
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(groupName);

  // Handle expanding layer card after creation
  useEffect(() => {
    if (expandedLayerAfterCreation && expandedLayerAfterCreation.startsWith(`${groupName}-`)) {
      toggleCard(expandedLayerAfterCreation);
      onClearExpandedLayer?.();
    }
  }, [expandedLayerAfterCreation, groupName, toggleCard, onClearExpandedLayer]);

  const moveLayerWithinGroup = (fromGroupIndex: number, direction: 'up' | 'down') => {
    const toGroupIndex = direction === 'up' ? fromGroupIndex - 1 : fromGroupIndex + 1;
    
    if (toGroupIndex < 0 || toGroupIndex >= layers.length) {
      return;
    }

    const fromOriginalIndex = layers[fromGroupIndex].originalIndex;
    const toOriginalIndex = layers[toGroupIndex].originalIndex;
    
    onMoveLayer(fromOriginalIndex, toOriginalIndex);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
  };

  const handleConfirmEdit = () => {
    if (onEditGroup && editingName.trim() && editingName.trim() !== groupName) {
      const success = onEditGroup(groupName, editingName.trim());
      if (success) {
        setIsEditingName(false);
      }
    } else {
      setIsEditingName(false);
      setEditingName(groupName);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditingName(groupName);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteGroup?.(groupName);
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <Card className="border-primary/20">
          <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                    
                    {isEditingName ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="h-7 w-48"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleConfirmEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-lg text-primary">{groupName}</CardTitle>
                        {onEditGroup && (
                          <Button size="sm" variant="ghost" onClick={handleStartEdit}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    )}
                    
                    <Badge variant="secondary" className="text-xs">
                      {layers.length} layers
                    </Badge>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                    {onDeleteGroup && (
                      <Button 
                        onClick={handleDelete} 
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      onClick={onAddLayer} 
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Layer
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {layers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No layers in this group yet.</p>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
      
      {onMoveGroup && (
        <div className="flex-shrink-0 pt-4">
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveGroup('up')}
              disabled={!canMoveGroupUp}
              className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveGroup('down')}
              disabled={!canMoveGroupDown}
              className="h-6 w-6 p-0 bg-white border border-muted hover:bg-muted"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerGroup;
