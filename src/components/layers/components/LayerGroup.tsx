import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Edit2, Check, X, AlertTriangle, Triangle, FolderPlus } from 'lucide-react';
import LayerMoveControls from './LayerMoveControls';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataSource } from '@/types/config';
import { useLayersTabContext } from '@/contexts/LayersTabContext';
import { calculateQAStats } from '@/utils/qaUtils';
import SubInterfaceGroup from './SubInterfaceGroup';
import AddSubGroupDialog from './AddSubGroupDialog';
import DeleteSubGroupDialog from './DeleteSubGroupDialog';
import SortableLayerCard from './SortableLayerCard';
import DroppableGroupZone from './DroppableGroupZone';
interface LayerGroupProps {
  groupName: string;
  groupIndex: number;
  sources: DataSource[];
  sourceIndices: number[];
  expandedLayers: Set<number>;
  onToggleLayer: (index: number) => void;
  onRemoveInterfaceGroup: (groupName: string) => void;
  onAddLayer: (groupName: string, subGroupName?: string) => void;
  onMoveGroup: (groupIndex: number, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  isExpanded: boolean;
  onToggleGroup: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  // Sub-group management
  onAddSubGroup?: (subGroupName: string, selectedLayerIndices: number[]) => void;
  onRenameSubGroup?: (oldName: string, newName: string) => void;
  onRemoveSubGroup?: (subGroupName: string) => void;
  onUngroupSubGroup?: (subGroupName: string) => void;
  onMoveSubGroup?: (subGroupName: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  expandedSubGroups?: Set<string>;
  onToggleSubGroup?: (subGroupName: string) => void;
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
  canMoveDown,
  onAddSubGroup,
  onRenameSubGroup,
  onRemoveSubGroup,
  onUngroupSubGroup,
  onMoveSubGroup,
  expandedSubGroups = new Set(),
  onToggleSubGroup
}: LayerGroupProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(groupName);
  const [showAddSubGroupDialog, setShowAddSubGroupDialog] = useState(false);
  const [deleteSubGroupName, setDeleteSubGroupName] = useState<string | null>(null);

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
    config,
    onUpdateConfig,
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

  // Group layers by subinterfaceGroup property, maintaining order based on first appearance
  const { subGrouped, ungrouped, existingSubGroups, orderedSubGroups } = useMemo(() => {
    const subGrouped: Record<string, Array<{ source: DataSource; index: number }>> = {};
    const ungrouped: Array<{ source: DataSource; index: number }> = [];
    const orderedSubGroups: string[] = [];

    sources.forEach((source, idx) => {
      const subGroup = source.layout?.subinterfaceGroup;
      if (subGroup) {
        if (!subGrouped[subGroup]) {
          subGrouped[subGroup] = [];
          orderedSubGroups.push(subGroup);
        }
        subGrouped[subGroup].push({ source, index: sourceIndices[idx] });
      } else {
        ungrouped.push({ source, index: sourceIndices[idx] });
      }
    });

    const existingSubGroups = Object.keys(subGrouped);
    return { subGrouped, ungrouped, existingSubGroups, orderedSubGroups };
  }, [sources, sourceIndices]);

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
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Compute available layers for sub-group creation (ungrouped layers only)
  const availableLayersForSubGroup = useMemo(() => {
    return ungrouped.map(item => ({
      name: item.source.name,
      index: item.index
    }));
  }, [ungrouped]);

  const handleAddSubGroup = (subGroupName: string, selectedLayerIndices: number[]): void => {
    if (onAddSubGroup) {
      onAddSubGroup(subGroupName, selectedLayerIndices);
    }
  };

  const handleCreateNewLayerInSubGroup = (subGroupName: string) => {
    // Called when user chooses "Create New Layer" in wizard
    onAddLayer(groupName, subGroupName);
  };

  const getSubGroupLayerCount = (subGroupName: string): number => {
    return subGrouped[subGroupName]?.length || 0;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <DroppableGroupZone
          id={`drop-${groupName}`}
          interfaceGroup={groupName}
          isCollapsed={!isExpanded}
          onExpand={onToggleGroup}
        >
          <Card className="border-primary/20">
            <Collapsible open={isExpanded} onOpenChange={onToggleGroup}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 p-2">
                      <div className="h-4 w-4" />
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="text-base font-medium h-7 flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleConfirmEdit} className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -ml-2 flex-1">
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
                          {qaStats.success > 0 && (
                            <div className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">{qaStats.success}</span>
                            </div>
                          )}
                          {qaStats.info > 0 && (
                            <div className="flex items-center gap-1">
                              <Triangle className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600">{qaStats.info}</span>
                            </div>
                          )}
                          {qaStats.warning > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-amber-600">{qaStats.warning}</span>
                            </div>
                          )}
                          {qaStats.error > 0 && (
                            <div className="flex items-center gap-1">
                              <Triangle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600">{qaStats.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  )}
                  {!isEditing && (
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
                        onClick={() => setShowAddSubGroupDialog(true)}
                        className="text-amber-700 hover:bg-amber-100 border-amber-300"
                        title="Add Sub-Group"
                      >
                        <FolderPlus className="h-3 w-3 mr-1" />
                        Add Sub-Group
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
                  )}
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-3 bg-slate-200">
                  <div className="space-y-3">
                    {/* Render sub-groups first, in order based on first layer appearance */}
                    {orderedSubGroups.map((subGroupName, subGroupIdx) => {
                      const subGroupItems = subGrouped[subGroupName];
                      return (
                        <SubInterfaceGroup
                          key={subGroupName}
                          subGroupName={subGroupName}
                          parentInterfaceGroup={groupName}
                          sources={subGroupItems.map(item => item.source)}
                          sourceIndices={subGroupItems.map(item => item.index)}
                          expandedLayers={expandedLayers}
                          onToggleLayer={onToggleLayer}
                          isExpanded={expandedSubGroups.has(subGroupName)}
                          onToggle={() => onToggleSubGroup?.(subGroupName)}
                          onAddLayer={() => onAddLayer(groupName, subGroupName)}
                          onRenameSubGroup={(newName) => onRenameSubGroup?.(subGroupName, newName)}
                          onRemoveSubGroup={() => setDeleteSubGroupName(subGroupName)}
                          onMoveSubGroupUp={() => onMoveSubGroup?.(subGroupName, 'up')}
                          onMoveSubGroupDown={() => onMoveSubGroup?.(subGroupName, 'down')}
                          onMoveSubGroupToTop={() => onMoveSubGroup?.(subGroupName, 'top')}
                          onMoveSubGroupToBottom={() => onMoveSubGroup?.(subGroupName, 'bottom')}
                          canMoveUp={subGroupIdx > 0}
                          canMoveDown={subGroupIdx < orderedSubGroups.length - 1}
                        />
                      );
                    })}

                    {/* Render ungrouped layers after sub-groups */}
                    {ungrouped.map(({ source, index: actualIndex }) => {
                      const idx = ungrouped.findIndex(item => item.index === actualIndex);
                      return (
                        <div key={actualIndex} className="flex items-center gap-2">
                          <div className="flex-1">
                            <SortableLayerCard
                              id={`layer-${actualIndex}`}
                              source={source}
                              index={actualIndex}
                              interfaceGroup={groupName}
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
                            canMoveDown={idx < ungrouped.length - 1}
                            canMoveToTop={idx > 0}
                            canMoveToBottom={idx < ungrouped.length - 1}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </DroppableGroupZone>
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

      {/* Add Sub-Group Dialog */}
      <AddSubGroupDialog
        open={showAddSubGroupDialog}
        onOpenChange={setShowAddSubGroupDialog}
        onAdd={handleAddSubGroup}
        onCreateNewLayer={handleCreateNewLayerInSubGroup}
        parentInterfaceGroup={groupName}
        existingSubGroups={existingSubGroups}
        availableLayers={availableLayersForSubGroup}
      />

      {/* Delete Sub-Group Dialog */}
      <DeleteSubGroupDialog
        open={!!deleteSubGroupName}
        onOpenChange={(open) => !open && setDeleteSubGroupName(null)}
        subGroupName={deleteSubGroupName || ''}
        parentInterfaceGroup={groupName}
        layerCount={deleteSubGroupName ? getSubGroupLayerCount(deleteSubGroupName) : 0}
        onDelete={() => {
          if (deleteSubGroupName && onRemoveSubGroup) {
            onRemoveSubGroup(deleteSubGroupName);
            setDeleteSubGroupName(null);
          }
        }}
        onUngroup={() => {
          if (deleteSubGroupName && onUngroupSubGroup) {
            onUngroupSubGroup(deleteSubGroupName);
            setDeleteSubGroupName(null);
          }
        }}
      />
    </div>
  );
};

export default LayerGroup;
