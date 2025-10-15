
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { DataSource, isDataSourceItemArray, Service, DataSourceMeta } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';
import LayerMetadata from './LayerMetadata';
import LayerCategories from './LayerCategories';
import SwipeLayerConfig from './SwipeLayerConfig';
import LayerLegendDisplay from './LayerLegendDisplay';
import LayerControlsDisplay from './LayerControlsDisplay';
import RegularLayerContent from './RegularLayerContent';
import LayerAttributionDisplay from './LayerAttributionDisplay';
import LayerColormapsDisplay from './LayerColormapsDisplay';

interface LayerCardContentProps {
  source: DataSource;
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
}

const LayerCardContent = ({
  source,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource
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


      {/* Only show data source display for non-swipe layers */}
      {!isSwipeLayer && (
        <RegularLayerContent
          source={source}
          services={(config.services || []) as Service[]}
          onAddDataSource={onAddDataSource}
          onRemoveDataSource={onRemoveDataSource}
          onRemoveStatisticsSource={onRemoveStatisticsSource}
          onEditDataSource={onEditDataSource}
          onEditStatisticsSource={onEditStatisticsSource}
          onUpdateMeta={handleUpdateMeta}
        />
      )}

      {/* Show swipe configuration for swipe layers */}
      {isSwipeLayer && <SwipeLayerConfig source={source} />}
    </CardContent>
  );
};

export default LayerCardContent;
