
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
}

const LayerCardContent = ({
  source,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onAddStatisticsSource
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
          onAddConstraintSource={() => {
            toast({
              title: "Coming Soon",
              description: "Constraint source management will be available soon.",
            });
          }}
          onAddWorkflow={() => {
            toast({
              title: "Coming Soon",
              description: "Workflow management will be available soon.",
            });
          }}
          onRemoveDataSource={(_, dataIndex) => onRemoveDataSource(dataIndex)}
          onRemoveStatisticsSource={(_, statsIndex) => onRemoveStatisticsSource?.(statsIndex)}
          onRemoveConstraintSource={() => {
            toast({
              title: "Coming Soon",
              description: "Constraint removal will be available soon.",
            });
          }}
          onRemoveWorkflow={() => {
            toast({
              title: "Coming Soon",
              description: "Workflow removal will be available soon.",
            });
          }}
          onEditDataSource={(_, dataIndex) => onEditDataSource?.(dataIndex)}
          onEditStatisticsSource={(_, statsIndex) => onEditStatisticsSource?.(statsIndex)}
          onEditConstraintSource={() => {
            toast({
              title: "Coming Soon",
              description: "Constraint editing will be available soon.",
            });
          }}
          onEditWorkflow={() => {
            toast({
              title: "Coming Soon",
              description: "Workflow editing will be available soon.",
            });
          }}
          onUpdateMeta={handleUpdateMeta}
          onUpdateLayout={handleUpdateLayout}
        />
        </div>
      )}

      {/* Show swipe configuration for swipe layers */}
      {isSwipeLayer && <SwipeLayerConfig source={source} />}
    </CardContent>
  );
};

export default LayerCardContent;
