import React from 'react';
import { CardContent } from '@/components/ui/card';
import { DataSource, isDataSourceItemArray, Service, DataSourceMeta, DataSourceLayout, DataSourceItem } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from 'lucide-react';
import LayerMetadata from './LayerMetadata';
import SwipeLayerConfig from './SwipeLayerConfig';
import LayerControlsDisplay from './LayerControlsDisplay';
import LayerDescriptionAttributionDisplay from './LayerDescriptionAttributionDisplay';
import LayerFieldsDisplay from './LayerFieldsDisplay';
import LayerDataVisualisationSection from './LayerDataVisualisationSection';
import { LayerCardTabs } from './LayerCardTabs';
import { isVectorFormat } from '@/utils/fieldDetection';

interface LayerCardContentProps {
  source: DataSource;
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
  onAddStatisticsSource?: () => void;
  onAddConstraintSource?: (layerIndex: number) => void;
  onRemoveConstraintSource?: (constraintIndex: number) => void;
  onEditConstraintSource?: (constraintIndex: number) => void;
  onMoveConstraintUp?: (constraintIndex: number) => void;
  onMoveConstraintDown?: (constraintIndex: number) => void;
  onMoveConstraintToTop?: (constraintIndex: number) => void;
  onMoveConstraintToBottom?: (constraintIndex: number) => void;
  onAddWorkflow?: (workflow: any) => void;
  onRemoveWorkflow?: (workflowIndex: number) => void;
  onUpdateWorkflow?: (workflowIndex: number, workflow: any) => void;
  onMoveWorkflowUp?: (workflowIndex: number) => void;
  onMoveWorkflowDown?: (workflowIndex: number) => void;
  onMoveWorkflowToTop?: (workflowIndex: number) => void;
  onMoveWorkflowToBottom?: (workflowIndex: number) => void;
  // Chart operations
  onAddChart?: () => void;
  onRemoveChart?: (chartIndex: number) => void;
  onEditChart?: (chartIndex: number) => void;
}

const LayerCardContent = ({
  source,
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
  onAddWorkflow,
  onRemoveWorkflow,
  onUpdateWorkflow,
  onMoveWorkflowUp,
  onMoveWorkflowDown,
  onMoveWorkflowToTop,
  onMoveWorkflowToBottom,
  onAddChart,
  onRemoveChart,
  onEditChart
}: LayerCardContentProps) => {
  const { config, dispatch } = useConfig();
  const { toast } = useToast();
  const isSwipeLayer = source.meta?.swipeConfig !== undefined;

  // Find the index of this source in the config
  const sourceIndex = config.sources.findIndex(s => s.name === source.name);

  // Extract first vector data source for fields editor
  const firstVectorSource = isDataSourceItemArray(source.data)
    ? source.data.find((item: DataSourceItem) => item.format && isVectorFormat(item.format))
    : undefined;

  // Handler to update meta fields
  const handleUpdateMeta = (updates: Partial<DataSourceMeta>) => {
    if (sourceIndex === -1) return;

    const updatedSource = {
      ...source,
      meta: {
        ...source.meta,
        ...updates
      }
    };

    dispatch({
      type: 'UPDATE_SOURCE',
      payload: {
        index: sourceIndex,
        source: updatedSource
      }
    });

    const updateKeys = Object.keys(updates);
    toast({
      title: "Layer Updated",
      description: `Successfully updated ${updateKeys.join(', ')}`,
    });
  };

  // Handler to update layout fields
  const handleUpdateLayout = (updates: Partial<DataSourceLayout>) => {
    if (sourceIndex === -1) return;

    const updatedSource = {
      ...source,
      layout: {
        ...source.layout,
        ...updates
      }
    };

    dispatch({
      type: 'UPDATE_SOURCE',
      payload: {
        index: sourceIndex,
        source: updatedSource
      }
    });

    toast({
      title: "Layout Updated",
      description: "Legend configuration has been updated successfully",
    });
  };

  // Handler to update bands on data source items
  const handleUpdateDataBands = (dataIndex: number, bands: number[], applyToAll: boolean) => {
    if (sourceIndex === -1 || !isDataSourceItemArray(source.data)) return;

    const updatedData = source.data.map((item: DataSourceItem, idx: number) => {
      const isTarget = idx === dataIndex;
      const isCog = item.format?.toLowerCase() === 'cog';
      if (isTarget || (applyToAll && isCog)) {
        return { ...item, bands: bands.length > 0 ? bands : undefined };
      }
      return item;
    });

    dispatch({
      type: 'UPDATE_SOURCE',
      payload: {
        index: sourceIndex,
        source: { ...source, data: updatedData }
      }
    });

    toast({
      title: "Bands Updated",
      description: applyToAll
        ? `Band selection applied to all COG sources in this layer`
        : `Band selection updated for this data source`,
    });
  };

  return (
    <CardContent className="space-y-4 pl-[46px]">
      <LayerMetadata source={source} />
      
      {/* Description & Attribution Display */}
      <LayerDescriptionAttributionDisplay source={source} onUpdateMeta={handleUpdateMeta} />

      {/* Data Visualisation: Categories, Colormaps, Legend, RGB Composites */}
      <LayerDataVisualisationSection source={source} onUpdateMeta={handleUpdateMeta} />

      {/* Fields - Vector layer attribute configuration */}
      {firstVectorSource && (
        <LayerFieldsDisplay
          fields={source.meta?.fields || {}}
          onUpdate={(fields) => handleUpdateMeta({ fields })}
          sourceUrl={firstVectorSource.url}
          sourceFormat={firstVectorSource.format}
        />
      )}

      {/* Controls Display */}
      <LayerControlsDisplay source={source} />

      {/* Data Sources Section - only show for non-swipe layers */}
      {!isSwipeLayer && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">Data Sources</h4>
          </div>
          <div className="ml-6">
          <LayerCardTabs
          source={source}
          services={(config.services || []) as Service[]}
          layerIndex={sourceIndex}
          onUpdateMeta={handleUpdateMeta}
          onUpdateLayout={handleUpdateLayout}
          onUpdateDataBands={handleUpdateDataBands}
          onAddDataSource={() => onAddDataSource?.()}
          onAddStatisticsSource={onAddStatisticsSource}
          onAddConstraintSource={onAddConstraintSource}
          onRemoveDataSource={(_, dataIndex) => onRemoveDataSource(dataIndex)}
          onRemoveStatisticsSource={(_, statsIndex) => onRemoveStatisticsSource?.(statsIndex)}
          onRemoveConstraintSource={(_, constraintIndex) => onRemoveConstraintSource?.(constraintIndex)}
          onEditDataSource={(_, dataIndex) => onEditDataSource?.(dataIndex)}
          onEditStatisticsSource={(_, statsIndex) => onEditStatisticsSource?.(statsIndex)}
          onEditConstraintSource={(_, constraintIndex) => onEditConstraintSource?.(constraintIndex)}
          onMoveConstraintUp={(_, constraintIndex) => onMoveConstraintUp?.(constraintIndex)}
          onMoveConstraintDown={(_, constraintIndex) => onMoveConstraintDown?.(constraintIndex)}
          onMoveConstraintToTop={(_, constraintIndex) => onMoveConstraintToTop?.(constraintIndex)}
          onMoveConstraintToBottom={(_, constraintIndex) => onMoveConstraintToBottom?.(constraintIndex)}
          onReorderDataSource={() => {}}
          onReorderStatisticsSource={() => {}}
          onAddWorkflow={(_, workflow) => onAddWorkflow?.(workflow)}
          onRemoveWorkflow={(_, workflowIndex) => onRemoveWorkflow?.(workflowIndex)}
          onUpdateWorkflow={(_, workflowIndex, workflow) => onUpdateWorkflow?.(workflowIndex, workflow)}
          onMoveWorkflowUp={(_, workflowIndex) => onMoveWorkflowUp?.(workflowIndex)}
          onMoveWorkflowDown={(_, workflowIndex) => onMoveWorkflowDown?.(workflowIndex)}
          onMoveWorkflowToTop={(_, workflowIndex) => onMoveWorkflowToTop?.(workflowIndex)}
          onMoveWorkflowToBottom={(_, workflowIndex) => onMoveWorkflowToBottom?.(workflowIndex)}
          onAddChart={() => onAddChart?.()}
          onRemoveChart={(_, chartIndex) => onRemoveChart?.(chartIndex)}
          onEditChart={(_, chartIndex) => onEditChart?.(chartIndex)}
          />
          </div>
        </div>
      )}

      {/* Show swipe configuration for swipe layers */}
      {isSwipeLayer && <SwipeLayerConfig source={source} />}
    </CardContent>
  );
};

export default LayerCardContent;
