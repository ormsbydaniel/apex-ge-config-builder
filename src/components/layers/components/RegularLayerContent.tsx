
import React from 'react';
import DataSourceDisplay from './DataSourceDisplay';
import { DataSource } from '@/types/config';

interface RegularLayerContentProps {
  source: DataSource;
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
}

const RegularLayerContent = ({
  source,
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource
}: RegularLayerContentProps) => {
  return (
    <DataSourceDisplay
      source={source}
      onAddDataSource={onAddDataSource}
      onRemoveDataSource={onRemoveDataSource}
      onRemoveStatisticsSource={onRemoveStatisticsSource}
      onEditDataSource={onEditDataSource}
      onEditStatisticsSource={onEditStatisticsSource}
    />
  );
};

export default RegularLayerContent;
