import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronRight, Edit2, Check, X, AlertTriangle, Triangle } from 'lucide-react';
import LayerMoveControls from './LayerMoveControls';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import { useLayersTabContext } from '@/contexts/LayersTabContext';
import { calculateQAStats } from '@/utils/qaUtils';
import LayerCard from '../LayerCard';

interface SubInterfaceGroupProps {
  subGroupName: string;
  parentInterfaceGroup: string;
  sources: DataSource[];
  sourceIndices: number[];
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  // Sub-group actions
  onAddLayer: () => void;
  onRenameSubGroup: (newName: string) => void;
  onRemoveSubGroup: () => void;
}

const SubInterfaceGroup = ({
  subGroupName,
  parentInterfaceGroup,
  sources,
  sourceIndices,
  expandedLayers,
  onToggleLayer,
  isExpanded,
  onToggle,
  onAddLayer,
  onRenameSubGroup,
  onRemoveSubGroup
}: SubInterfaceGroupProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subGroupName);

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
    onAddStatisticsSource,
    onAddConstraintSource,
    onRemoveConstraintSource,
    onEditConstraintSource,
    onMoveConstraintUp,
    onMoveConstraintDown,
    onMoveConstraintToTop,
    onMoveConstraintToBottom,
    onMoveLayer,
    moveLayerToTop,
    moveLayerToBottom,
    onAddWorkflow,
    onRemoveWorkflow,
    onUpdateWorkflow,
    onMoveWorkflowUp,
    onMoveWorkflowDown,
    onMoveWorkflowToTop,
    onMoveWorkflowToBottom,
    onAddChart,
    onRemoveChart,
    onUpdateChart,
    onStartChartForm,
    onEditChartSource
  } = useLayersTabContext();

  // Calculate QA stats for this sub-group's sources
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
    setEditValue(subGroupName);
  };

  const handleConfirmEdit = () => {
    if (editValue.trim() && editValue.trim() !== subGroupName) {
      onRenameSubGroup(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(subGroupName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CardHeader className="pb-2 pt-2">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 p-1">
                <div className="h-4 w-4" />
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="text-sm font-medium h-6 flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleConfirmEdit} className="h-5 w-5 p-0 bg-green-600 hover:bg-green-700">
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-5 w-5 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <CollapsibleTrigger className="flex items-center gap-2 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 p-1 rounded-md -ml-1 flex-1">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-amber-600" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-amber-600" />
                )}
                <div className="flex items-center gap-2 flex-1">
                  <CardTitle className="text-sm text-amber-700 dark:text-amber-500">{subGroupName}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStartEdit}
                    className="h-5 w-5 p-0 ml-1 opacity-70 hover:opacity-100"
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                  </Button>
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {sources.length} layer{sources.length !== 1 ? 's' : ''}
                  </Badge>

                  {/* QA Status Indicators */}
                  <div className="flex items-center gap-2">
                    {qaStats.success > 0 && (
                      <div className="flex items-center gap-1">
                        <Check className="h-2.5 w-2.5 text-green-500" />
                        <span className="text-xs text-green-600">{qaStats.success}</span>
                      </div>
                    )}
                    {qaStats.info > 0 && (
                      <div className="flex items-center gap-1">
                        <Triangle className="h-2.5 w-2.5 text-blue-500" />
                        <span className="text-xs text-blue-600">{qaStats.info}</span>
                      </div>
                    )}
                    {qaStats.warning > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                        <span className="text-xs text-amber-600">{qaStats.warning}</span>
                      </div>
                    )}
                    {qaStats.error > 0 && (
                      <div className="flex items-center gap-1">
                        <Triangle className="h-2.5 w-2.5 text-red-500" />
                        <span className="text-xs text-red-600">{qaStats.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
            )}
            {!isEditing && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLayer();
                  }}
                  className="text-amber-700 hover:bg-amber-100 border-amber-300 h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Layer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSubGroup();
                  }}
                  className="text-destructive hover:bg-destructive/10 border-destructive/30 h-7"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2 pb-3 bg-amber-100/30 dark:bg-amber-950/20">
            <div className="space-y-2">
              {sources.map((source, idx) => {
                const actualIndex = sourceIndices[idx];
                return (
                  <div key={actualIndex} className="flex items-center gap-2">
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
                        onRemoveDataSource={dataSourceIndex => onRemoveDataSource(actualIndex, dataSourceIndex)}
                        onRemoveStatisticsSource={statsIndex => onRemoveStatisticsSource(actualIndex, statsIndex)}
                        onEditDataSource={dataIndex => onEditDataSource(actualIndex, dataIndex)}
                        onEditStatisticsSource={statsIndex => onEditStatisticsSource(actualIndex, statsIndex)}
                        onAddStatisticsSource={() => onAddStatisticsSource(actualIndex)}
                        onAddConstraintSource={onAddConstraintSource}
                        onRemoveConstraintSource={constraintIndex => onRemoveConstraintSource(actualIndex, constraintIndex)}
                        onEditConstraintSource={constraintIndex => onEditConstraintSource(actualIndex, constraintIndex)}
                        onMoveConstraintUp={constraintIndex => onMoveConstraintUp(actualIndex, constraintIndex)}
                        onMoveConstraintDown={constraintIndex => onMoveConstraintDown(actualIndex, constraintIndex)}
                        onMoveConstraintToTop={constraintIndex => onMoveConstraintToTop(actualIndex, constraintIndex)}
                        onMoveConstraintToBottom={constraintIndex => onMoveConstraintToBottom(actualIndex, constraintIndex)}
                        onAddWorkflow={workflow => onAddWorkflow(actualIndex, workflow)}
                        onRemoveWorkflow={workflowIndex => onRemoveWorkflow(actualIndex, workflowIndex)}
                        onUpdateWorkflow={(workflowIndex, workflow) => onUpdateWorkflow(actualIndex, workflowIndex, workflow)}
                        onMoveWorkflowUp={workflowIndex => onMoveWorkflowUp(actualIndex, workflowIndex)}
                        onMoveWorkflowDown={workflowIndex => onMoveWorkflowDown(actualIndex, workflowIndex)}
                        onMoveWorkflowToTop={workflowIndex => onMoveWorkflowToTop(actualIndex, workflowIndex)}
                        onMoveWorkflowToBottom={workflowIndex => onMoveWorkflowToBottom(actualIndex, workflowIndex)}
                        onAddChart={() => onStartChartForm ? onStartChartForm(actualIndex) : onAddChart(actualIndex, { chartType: 'xy', sources: [] })}
                        onRemoveChart={chartIndex => onRemoveChart(actualIndex, chartIndex)}
                        onEditChart={chartIndex => onEditChartSource ? onEditChartSource(actualIndex, chartIndex) : undefined}
                        isExpanded={expandedLayers.has(actualIndex)}
                        onToggle={() => onToggleLayer(actualIndex)}
                      />
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
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SubInterfaceGroup;
