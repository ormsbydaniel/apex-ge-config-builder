
import React from 'react';
import { DataSource } from '@/types/config';

interface LayerMetadataProps {
  source: DataSource;
}

const LayerMetadata = ({ source }: LayerMetadataProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
      {source.hasFeatureStatistics && (
        <div>
          <span className="font-medium">Statistics:</span> Yes
        </div>
      )}
    </div>
  );
};

export default LayerMetadata;
