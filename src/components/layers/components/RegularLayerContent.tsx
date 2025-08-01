
import React from 'react';
import DataSourceDisplay from './DataSourceDisplay';
import { DataSource, Service } from '@/types/config';

interface RegularLayerContentProps {
  source: DataSource;
  services?: Service[];
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
}

const RegularLayerContent = ({
  source,
  services = [],
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource
}: RegularLayerContentProps) => {
  return (
    <DataSourceDisplay
      source={source}
      services={services}
      onAddDataSource={onAddDataSource}
      onRemoveDataSource={onRemoveDataSource}
      onRemoveStatisticsSource={onRemoveStatisticsSource}
      onEditDataSource={onEditDataSource}
      onEditStatisticsSource={onEditStatisticsSource}
    />
  );
};

export default RegularLayerContent;
