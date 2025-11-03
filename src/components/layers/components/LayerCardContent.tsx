
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { DataSource, isDataSourceItemArray, Service, DataSourceMeta, DataSourceLayout } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';
import LayerMetadata from './LayerMetadata';
import LayerCategories from './LayerCategories';
import SwipeLayerConfig from './SwipeLayerConfig';
import LayerLegendDisplay from './LayerLegendDisplay';
import LayerControlsDisplay from './LayerControlsDisplay';
import LayerAttributionDisplay from './LayerAttributionDisplay';
import LayerColormapsDisplay from './LayerColormapsDisplay';
import { LayerCardTabs } from './LayerCardTabs';

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
  onMoveWorkflowToBottom
}: LayerCardContentProps) => {
  const { config, dispatch } = useConfig();
  const { toast } = useToast();
  const isSwipeLayer = source.meta?.swipeConfig !== undefined;

  // Find the index of this source in the config
  const sourceIndex = config.sources.findIndex(s => s.name === source.name);

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

    // Show success toast
    const updateDescription = [];
    if (updates.min !== undefined) updateDescription.push('min');
    if (updates.max !== undefined) updateDescription.push('max');
    if (updates.colormaps !== undefined) updateDescription.push('colormaps');

    toast({
      title: "Metadata Updated",
      description: `Successfully updated ${updateDescription.join(', ')} values from COG metadata`,
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

  return (
    <CardContent className="space-y-4 pl-[46px]">
      <LayerMetadata source={source} />
      
      {/* Attribution Display */}
      <LayerAttributionDisplay source={source} />

      {/* Categories */}
      {source.meta?.categories && source.meta.categories.length > 0 && (
        <LayerCategories categories={source.meta.categories} />
      )}

      {/* Colormaps */}
      {source.meta?.colormaps && source.meta.colormaps.length > 0 && (
        <LayerColormapsDisplay colormaps={source.meta.colormaps} />
      )}
      
      {/* Legend Display */}
      <LayerLegendDisplay source={source} />

      {/* Controls Display */}
      <LayerControlsDisplay source={source} />


      {/* Data Sources Section - only show for non-swipe layers */}
      {!isSwipeLayer && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Data Sources</h4>
          <LayerCardTabs
          source={source}
          services={(config.services || []) as Service[]}
          layerIndex={sourceIndex}
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
        />
        </div>
      )}

      {/* Show swipe configuration for swipe layers */}
      {isSwipeLayer && <SwipeLayerConfig source={source} />}
    </CardContent>
  );
};

export default LayerCardContent;
