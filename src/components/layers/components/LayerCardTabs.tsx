import React, { useState } from 'react';
import { DataSource, Service, WorkflowItem } from '@/types/config';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataSourcesTab } from './DataSourcesTab';
import { StatisticsSourcesTab } from './StatisticsSourcesTab';
import { ConstraintSourcesTab } from './ConstraintSourcesTab';
import { WorkflowsTab } from './WorkflowsTab';
import { WorkflowEditorDialog } from './WorkflowEditorDialog';

interface LayerCardTabsProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onUpdateMeta?: (updates: Partial<import('@/types/config').DataSourceMeta>) => void;
  onUpdateLayout?: (updates: Partial<import('@/types/config').DataSourceLayout>) => void;
  onAddDataSource: (layerIndex: number, isAddingStatistics: boolean) => void;
  onRemoveDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onReorderDataSource: (layerIndex: number, fromIndex: number, toIndex: number) => void;
  onAddStatisticsSource: (layerIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onReorderStatisticsSource: (layerIndex: number, fromIndex: number, toIndex: number) => void;
  onAddConstraintSource: (layerIndex: number) => void;
  onRemoveConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onEditConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintUp: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintDown: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintToTop: (layerIndex: number, constraintIndex: number) => void;
  onMoveConstraintToBottom: (layerIndex: number, constraintIndex: number) => void;
  onAddWorkflow: (layerIndex: number, workflow: WorkflowItem) => void;
  onRemoveWorkflow: (layerIndex: number, workflowIndex: number) => void;
  onUpdateWorkflow: (layerIndex: number, workflowIndex: number, workflow: WorkflowItem) => void;
  onMoveWorkflowUp: (layerIndex: number, workflowIndex: number) => void;
  onMoveWorkflowDown: (layerIndex: number, workflowIndex: number) => void;
  onMoveWorkflowToTop: (layerIndex: number, workflowIndex: number) => void;
  onMoveWorkflowToBottom: (layerIndex: number, workflowIndex: number) => void;
}

export function LayerCardTabs({
  source,
  services,
  layerIndex,
  onUpdateMeta,
  onUpdateLayout,
  onAddDataSource,
  onRemoveDataSource,
  onEditDataSource,
  onReorderDataSource,
  onAddStatisticsSource,
  onRemoveStatisticsSource,
  onEditStatisticsSource,
  onReorderStatisticsSource,
  onAddConstraintSource,
  onRemoveConstraintSource,
  onEditConstraintSource,
  onMoveConstraintUp,
  onMoveConstraintDown,
  onMoveConstraintToTop,
  onMoveConstraintToBottom,
  onAddWorkflow,
  onRemoveWorkflow,
  onUpdateWorkflow,
  onMoveWorkflowUp,
  onMoveWorkflowDown,
  onMoveWorkflowToTop,
  onMoveWorkflowToBottom
}: LayerCardTabsProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [editingWorkflowIndex, setEditingWorkflowIndex] = useState<number | null>(null);

  const dataCount = source.data?.length || 0;
  const statsCount = source.statistics?.length || 0;
  const constraintsCount = source.constraints?.length || 0;
  const workflowsCount = source.workflows?.length || 0;

  return (
    <>
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="data">
              Datasets ({dataCount})
            </TabsTrigger>
            <TabsTrigger value="statistics">
              Statistics ({statsCount})
            </TabsTrigger>
            <TabsTrigger value="constraints">
              Constraints ({constraintsCount})
            </TabsTrigger>
            <TabsTrigger value="workflows">
              Workflows ({workflowsCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <DataSourcesTab
              source={source}
              services={services}
              layerIndex={layerIndex}
              onAdd={(layerIndex) => onAddDataSource(layerIndex, false)}
              onRemove={onRemoveDataSource}
              onEdit={onEditDataSource}
              onUpdateMeta={onUpdateMeta}
              onUpdateLayout={onUpdateLayout}
            />
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsSourcesTab
              source={source}
              services={services}
              layerIndex={layerIndex}
              onAdd={onAddStatisticsSource}
              onRemove={onRemoveStatisticsSource}
              onEdit={onEditStatisticsSource}
            />
          </TabsContent>

          <TabsContent value="constraints">
            <ConstraintSourcesTab
              source={source}
              services={services}
              layerIndex={layerIndex}
              onAddConstraintSource={onAddConstraintSource}
              onRemove={onRemoveConstraintSource}
              onEdit={onEditConstraintSource}
              onMoveUp={onMoveConstraintUp}
              onMoveDown={onMoveConstraintDown}
              onMoveToTop={onMoveConstraintToTop}
              onMoveToBottom={onMoveConstraintToBottom}
            />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowsTab
              source={source}
              layerIndex={layerIndex}
              onAdd={() => {
                setEditingWorkflowIndex(null);
                setWorkflowDialogOpen(true);
              }}
              onRemove={onRemoveWorkflow}
              onEdit={(layerIndex, workflowIndex) => {
                setEditingWorkflowIndex(workflowIndex);
                setWorkflowDialogOpen(true);
              }}
              onMoveUp={onMoveWorkflowUp}
              onMoveDown={onMoveWorkflowDown}
              onMoveToTop={onMoveWorkflowToTop}
              onMoveToBottom={onMoveWorkflowToBottom}
            />
          </TabsContent>
        </Tabs>
      </div>

      <WorkflowEditorDialog
        open={workflowDialogOpen}
        onOpenChange={setWorkflowDialogOpen}
        workflow={editingWorkflowIndex !== null ? source.workflows?.[editingWorkflowIndex] : undefined}
        onSave={(workflow) => {
          if (editingWorkflowIndex !== null) {
            onUpdateWorkflow(layerIndex, editingWorkflowIndex, workflow);
          } else {
            onAddWorkflow(layerIndex, workflow);
          }
          setEditingWorkflowIndex(null);
        }}
      />
    </>
  );
}
