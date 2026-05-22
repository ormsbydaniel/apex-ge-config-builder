import React, { useState } from 'react';
import { DataSource, Service } from '@/types/config';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataSourcesTab } from './DataSourcesTab';
import { StatisticsSourcesTab } from './StatisticsSourcesTab';
import { ConstraintSourcesTab } from './ConstraintSourcesTab';
import { ChartsTab } from './ChartsTab';

interface LayerCardTabsProps {
  source: DataSource;
  services: Service[];
  layerIndex: number;
  onUpdateMeta?: (updates: Partial<import('@/types/config').DataSourceMeta>) => void;
  onUpdateLayout?: (updates: Partial<import('@/types/config').DataSourceLayout>) => void;
  onUpdateDataBands?: (dataIndex: number, bands: number[], applyToAll: boolean) => void;
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
  // Chart operations
  onAddChart: (layerIndex: number) => void;
  onRemoveChart: (layerIndex: number, chartIndex: number) => void;
  onEditChart: (layerIndex: number, chartIndex: number) => void;
  onStartChartForm?: (layerIndex: number) => void;
  onEditChartSource?: (layerIndex: number, chartIndex: number) => void;
}

export function LayerCardTabs({
  source,
  services,
  layerIndex,
  onUpdateMeta,
  onUpdateLayout,
  onUpdateDataBands,
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
  onAddChart,
  onRemoveChart,
  onEditChart,
  onStartChartForm,
  onEditChartSource
}: LayerCardTabsProps) {
  const [activeTab, setActiveTab] = useState('data');

  const dataCount = source.data?.length || 0;
  const statsCount = source.statistics?.length || 0;
  const constraintsCount = source.constraints?.length || 0;
  const chartsCount = source.charts?.length || 0;

  return (
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
          <TabsTrigger value="charts">
            Charts ({chartsCount})
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
            onUpdateDataBands={onUpdateDataBands}
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

        <TabsContent value="charts">
          <ChartsTab
            source={source}
            services={services}
            layerIndex={layerIndex}
            onAdd={onAddChart}
            onRemove={onRemoveChart}
            onUpdate={onEditChart as any}
            onStartChartForm={onStartChartForm}
            onEditChartSource={onEditChart}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
