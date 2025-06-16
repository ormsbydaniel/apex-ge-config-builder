
import React from 'react';
import { DataSource } from '@/types/config';
import UnifiedAttributionSection from './UnifiedAttributionSection';

interface AttributionSectionProps {
  formData: DataSource;
  onUpdateFormData: (path: string, value: any) => void;
}

const AttributionSection = ({ formData, onUpdateFormData }: AttributionSectionProps) => {
  return (
    <UnifiedAttributionSection
      attributionText={formData.meta.attribution.text}
      attributionUrl={formData.meta.attribution.url || ''}
      onUpdate={onUpdateFormData}
      fieldPrefix="meta.attribution"
    />
  );
};

export default AttributionSection;
