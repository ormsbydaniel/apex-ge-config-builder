
import React from 'react';
import UnifiedAttributionSection from './UnifiedAttributionSection';

interface LayerAttributionSectionProps {
  attributionText: string;
  attributionUrl: string;
  onUpdate: (field: string, value: any) => void;
}

const LayerAttributionSection = ({
  attributionText,
  attributionUrl,
  onUpdate
}: LayerAttributionSectionProps) => {
  return (
    <UnifiedAttributionSection
      attributionText={attributionText}
      attributionUrl={attributionUrl}
      onUpdate={onUpdate}
    />
  );
};

export default LayerAttributionSection;
