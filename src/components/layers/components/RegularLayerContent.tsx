
import React from 'react';
import DataSourceDisplay from './DataSourceDisplay';
import { DataSource, Service, DataSourceMeta } from '@/types/config';

interface RegularLayerContentProps {
  source: DataSource;
  services?: Service[];
  onAddDataSource?: () => void;
  onRemoveDataSource: (dataSourceIndex: number) => void;
  onRemoveStatisticsSource?: (statsIndex: number) => void;
  onEditDataSource?: (dataIndex: number) => void;
  onEditStatisticsSource?: (statsIndex: number) => void;
  onUpdateMeta?: (updates: Partial<DataSourceMeta>) => void;
}

const RegularLayerContent = ({
  source,
  services = [],
  onAddDataSource,
  onRemoveDataSource,
  onRemoveStatisticsSource,
  onEditDataSource,
  onEditStatisticsSource,
  onUpdateMeta
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
      onUpdateMeta={onUpdateMeta}
    />
  );
};

export default RegularLayerContent;
