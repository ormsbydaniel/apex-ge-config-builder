
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { DataSource, isDataSourceItemArray } from '@/types/config';
import LayerMetadata from './LayerMetadata';
import LayerCategories from './LayerCategories';
import SwipeLayerConfig from './SwipeLayerConfig';
import LayerLegendDisplay from './LayerLegendDisplay';
import RegularLayerContent from './RegularLayerContent';
import LayerAttributionDisplay from './LayerAttributionDisplay';

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
  const isSwipeLayer = source.meta?.swipeConfig !== undefined;

  return (
    <CardContent className="space-y-4 pl-[46px]">
      <LayerMetadata source={source} />
      
      {/* Attribution Display */}
      <LayerAttributionDisplay source={source} />

      {/* Categories */}
      {source.meta?.categories && source.meta.categories.length > 0 && (
        <LayerCategories categories={source.meta.categories} />
      )}
      
      {/* Legend Display */}
      <LayerLegendDisplay source={source} />

      {/* Only show data source display for non-swipe layers */}
      {!isSwipeLayer && (
        <RegularLayerContent
          source={source}
          onAddDataSource={onAddDataSource}
          onRemoveDataSource={onRemoveDataSource}
          onRemoveStatisticsSource={onRemoveStatisticsSource}
          onEditDataSource={onEditDataSource}
          onEditStatisticsSource={onEditStatisticsSource}
        />
      )}

      {/* Show swipe configuration for swipe layers */}
      {isSwipeLayer && <SwipeLayerConfig source={source} />}
    </CardContent>
  );
};

export default LayerCardContent;
