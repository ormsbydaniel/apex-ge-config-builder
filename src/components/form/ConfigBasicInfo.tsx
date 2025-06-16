
import React from 'react';
import { DataSource } from '@/types/config';
import BasicInfoSection from './BasicInfoSection';

interface ConfigBasicInfoProps {
  formData: DataSource;
  interfaceGroups: string[];
  hasFeatureStatistics: boolean;
  onUpdateFormData: (path: string, value: any) => void;
  onSetHasFeatureStatistics: (value: boolean) => void;
}

const ConfigBasicInfo = ({
  formData,
  interfaceGroups,
  hasFeatureStatistics,
  onUpdateFormData,
  onSetHasFeatureStatistics
}: ConfigBasicInfoProps) => {
  return (
    <BasicInfoSection
      formData={formData}
      interfaceGroups={interfaceGroups}
      hasFeatureStatistics={hasFeatureStatistics}
      onUpdateFormData={onUpdateFormData}
      onSetHasFeatureStatistics={onSetHasFeatureStatistics}
    />
  );
};

export default ConfigBasicInfo;
