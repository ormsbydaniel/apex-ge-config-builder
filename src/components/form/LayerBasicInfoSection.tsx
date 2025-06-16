
import React from 'react';
import UnifiedBasicInfoSection from './UnifiedBasicInfoSection';

interface LayerBasicInfoSectionProps {
  name: string;
  description: string;
  interfaceGroup: string;
  hasFeatureStatistics: boolean;
  units: string;
  interfaceGroups: string[];
  onUpdate: (field: string, value: any) => void;
}

const LayerBasicInfoSection = ({
  name,
  description,
  interfaceGroup,
  hasFeatureStatistics,
  units,
  interfaceGroups,
  onUpdate
}: LayerBasicInfoSectionProps) => {
  return (
    <UnifiedBasicInfoSection
      name={name}
      description={description}
      interfaceGroup={interfaceGroup}
      interfaceGroups={interfaceGroups}
      hasFeatureStatistics={hasFeatureStatistics}
      units={units}
      isActive={false}
      onUpdate={onUpdate}
      showFeatureStatistics={true}
      showUnits={true}
      showIsActive={false}
    />
  );
};

export default LayerBasicInfoSection;
