import { DataSource, Service, DataSourceMeta, DataSourceLayout } from '@/types/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataSourcesTab } from './DataSourcesTab';
import { StatisticsSourcesTab } from './StatisticsSourcesTab';
import { ConstraintSourcesTab } from './ConstraintSourcesTab';
import { WorkflowsTab } from './WorkflowsTab';
import { useState } from 'react';

interface LayerCardTabsProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onAddDataSource: (layerIndex: number) => void;
  onAddStatisticsSource: (layerIndex: number) => void;
  onAddConstraintSource: (layerIndex: number) => void;
  onAddWorkflow: (layerIndex: number) => void;
  onRemoveDataSource: (layerIndex: number, dataIndex: number) => void;
  onRemoveStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onRemoveConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onRemoveWorkflow: (layerIndex: number, workflowIndex: number) => void;
  onEditDataSource: (layerIndex: number, dataIndex: number) => void;
  onEditStatisticsSource: (layerIndex: number, statsIndex: number) => void;
  onEditConstraintSource: (layerIndex: number, constraintIndex: number) => void;
  onEditWorkflow: (layerIndex: number, workflowIndex: number) => void;
  onUpdateMeta?: (updates: Partial<DataSourceMeta>) => void;
  onUpdateLayout?: (updates: Partial<DataSourceLayout>) => void;
}

export function LayerCardTabs({
  source,
  services,
  layerIndex,
  onAddDataSource,
  onAddStatisticsSource,
  onAddConstraintSource,
  onAddWorkflow,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onRemoveConstraintSource,
  onRemoveWorkflow,
  onEditDataSource,
  onEditStatisticsSource,
  onEditConstraintSource,
  onEditWorkflow,
  onUpdateMeta,
  onUpdateLayout,
}: LayerCardTabsProps) {
  const [activeTab, setActiveTab] = useState('data');

  const dataCount = source.data?.length || 0;
  const statsCount = source.statistics?.length || 0;
  const constraintsCount = source.constraints?.length || 0;
  const workflowsCount = source.workflows?.length || 0;

  return (
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

      <TabsContent value="data" className="mt-2">
        <DataSourcesTab
          source={source}
          services={services}
          layerIndex={layerIndex}
          onAdd={onAddDataSource}
          onRemove={onRemoveDataSource}
          onEdit={onEditDataSource}
          onUpdateMeta={onUpdateMeta}
          onUpdateLayout={onUpdateLayout}
        />
      </TabsContent>

      <TabsContent value="statistics" className="mt-2">
        <StatisticsSourcesTab
          source={source}
          services={services}
          layerIndex={layerIndex}
          onAdd={onAddStatisticsSource}
          onRemove={onRemoveStatisticsSource}
          onEdit={onEditStatisticsSource}
        />
      </TabsContent>

      <TabsContent value="constraints" className="mt-2">
        <ConstraintSourcesTab
          source={source}
          layerIndex={layerIndex}
          onAdd={onAddConstraintSource}
          onRemove={onRemoveConstraintSource}
          onEdit={onEditConstraintSource}
        />
      </TabsContent>

      <TabsContent value="workflows" className="mt-2">
        <WorkflowsTab
          source={source}
          layerIndex={layerIndex}
          onAdd={onAddWorkflow}
          onRemove={onRemoveWorkflow}
          onEdit={onEditWorkflow}
        />
      </TabsContent>
    </Tabs>
  );
}
