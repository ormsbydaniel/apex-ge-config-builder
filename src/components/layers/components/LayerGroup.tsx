import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Edit2, Check, X, AlertTriangle, Triangle } from 'lucide-react';
import LayerMoveControls from './LayerMoveControls';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import { useLayersTabContext } from '@/contexts/LayersTabContext';
import { calculateQAStats } from '@/utils/qaUtils';
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
  onMoveGroup: (groupIndex: number, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onRenameGroup: (oldName: string, newName: string) => void;
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
  onRenameGroup,
  isExpanded,
  onToggleGroup,
  canMoveUp,
  canMoveDown
}: LayerGroupProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(groupName);
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
    onMoveLayer,
    moveLayerToTop,
    moveLayerToBottom,
    config,
    onUpdateConfig
  } = useLayersTabContext();

  // Calculate QA stats for this group's sources
  const qaStats = calculateQAStats(sources);
  const handleMoveLayerInGroup = (fromIndex: number, direction: 'up' | 'down') => {
    const currentGroupSources = sourceIndices;
    const fromPosition = currentGroupSources.indexOf(fromIndex);
    if (fromPosition === -1) return;
    const toPosition = direction === 'up' ? fromPosition - 1 : fromPosition + 1;
    if (toPosition < 0 || toPosition >= currentGroupSources.length) return;
    const toIndex = currentGroupSources[toPosition];
    onMoveLayer(fromIndex, toIndex);
  };
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(groupName);
  };
  const handleConfirmEdit = () => {
    if (editValue.trim() && editValue.trim() !== groupName && !config.interfaceGroups.includes(editValue.trim())) {
      onRenameGroup(groupName, editValue.trim());
    }
    setIsEditing(false);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(groupName);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to CollapsibleTrigger
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  return <div className="flex items-center gap-3">
      <div className="flex-1">
        <Card className="border-primary/20">
          <Collapsible open={isExpanded} onOpenChange={onToggleGroup}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {isEditing ? <div className="flex items-center gap-2 flex-1 p-2">
                    <div className="h-4 w-4" /> {/* Spacer to align with chevron */}
                    <Input value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleKeyPress} className="text-base font-medium h-7 flex-1" autoFocus />
                    <Button size="sm" onClick={handleConfirmEdit} className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div> : <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 flex-1">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
                    <div className="flex items-center gap-2 flex-1">
                      <CardTitle className="text-base text-primary">{groupName}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={handleStartEdit} className="h-6 w-6 p-0 ml-1 opacity-70 hover:opacity-100">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        {sources.length} layer{sources.length !== 1 ? 's' : ''}
                      </Badge>
                      
                      {/* QA Status Indicators */}
                      <div className="flex items-center gap-2">
                        {qaStats.success > 0 && <div className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">{qaStats.success}</span>
                          </div>}
                        {qaStats.info > 0 && <div className="flex items-center gap-1">
                            <Triangle className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600">{qaStats.info}</span>
                          </div>}
                        {qaStats.warning > 0 && <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600">{qaStats.warning}</span>
                          </div>}
                        {qaStats.error > 0 && <div className="flex items-center gap-1">
                            <Triangle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">{qaStats.error}</span>
                          </div>}
                      </div>
                    </div>
                  </CollapsibleTrigger>}
                {!isEditing && <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onAddLayer(groupName)} className="text-primary hover:bg-primary/10 border-primary/30">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Layer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onRemoveInterfaceGroup(groupName)} className="text-destructive hover:bg-destructive/10 border-destructive/30">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-3 bg-slate-200">
                <div className="space-y-3">
                  {sources.map((source, idx) => {
                  const actualIndex = sourceIndices[idx];
                  return <div key={actualIndex} className="flex items-center gap-2">
                        <div className="flex-1">
                          <LayerCard source={source} index={actualIndex} onRemove={onRemoveLayer} onEdit={onEditLayer} onEditBaseLayer={onEditBaseLayer} onDuplicate={onDuplicateLayer} onUpdateLayer={onUpdateLayer} onAddDataSource={() => onAddDataSource(actualIndex)} onRemoveDataSource={dataSourceIndex => onRemoveDataSource(actualIndex, dataSourceIndex)} onRemoveStatisticsSource={statsIndex => onRemoveStatisticsSource(actualIndex, statsIndex)} onEditDataSource={dataIndex => onEditDataSource(actualIndex, dataIndex)} onEditStatisticsSource={statsIndex => onEditStatisticsSource(actualIndex, statsIndex)} isExpanded={expandedLayers.has(actualIndex)} onToggle={() => onToggleLayer(actualIndex)} validationResult={config.validationResults?.get(actualIndex)} />
                        </div>
                        <LayerMoveControls
                          onMoveUp={() => handleMoveLayerInGroup(actualIndex, 'up')}
                          onMoveDown={() => handleMoveLayerInGroup(actualIndex, 'down')}
                          onMoveToTop={() => moveLayerToTop(actualIndex, sourceIndices)}
                          onMoveToBottom={() => moveLayerToBottom(actualIndex, sourceIndices)}
                          canMoveUp={idx > 0}
                          canMoveDown={idx < sources.length - 1}
                          canMoveToTop={idx > 0}
                          canMoveToBottom={idx < sources.length - 1}
                        />
                      </div>;
                })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
      
      {/* Group move controls positioned in the space between card and panel edge */}
      <div className="flex gap-1 pt-3">
        <div className="flex flex-col gap-1">
          <Button variant="outline" size="sm" onClick={() => onMoveGroup(groupIndex, 'up')} disabled={!canMoveUp} className="h-6 w-6 p-0" title="Move group up">
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onMoveGroup(groupIndex, 'down')} disabled={!canMoveDown} className="h-6 w-6 p-0" title="Move group down">
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="outline" size="sm" onClick={() => onMoveGroup(groupIndex, 'top')} disabled={!canMoveUp} className="h-6 w-6 p-0" title="Move group to top">
            <ArrowUpToLine className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onMoveGroup(groupIndex, 'bottom')} disabled={!canMoveDown} className="h-6 w-6 p-0" title="Move group to bottom">
            <ArrowDownToLine className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>;
};
export default LayerGroup;