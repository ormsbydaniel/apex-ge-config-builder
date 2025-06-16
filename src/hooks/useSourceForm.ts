
import { useState } from 'react';
import { DataSource, DataSourceFormat } from '@/types/config';

const initialFormState: DataSource = {
  name: '',
  isActive: false,
  meta: {
    description: '',
    attribution: {
      text: '',
      url: ''
    },
    categories: []
  },
  layout: {
    interfaceGroup: '',
    layerCard: {
      toggleable: true
    }
  },
  data: [
    {
      url: '',
      layers: '',
      zIndex: 2,
      format: 'wms'
    }
  ]
};

export const useSourceForm = () => {
  const [selectedFormat, setSelectedFormat] = useState<DataSourceFormat>('wms');
  const [formData, setFormData] = useState<DataSource>(initialFormState);
  const [hasFeatureStatistics, setHasFeatureStatistics] = useState(false);

  const updateFormData = (path: string, value: any) => {
    console.log('updateFormData called:', path, '=', value);
    setFormData(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleFormatChange = (format: DataSourceFormat) => {
    console.log('=== useSourceForm handleFormatChange ===');
    console.log('Previous selectedFormat:', selectedFormat);
    console.log('New format:', format);
    console.log('Format type:', typeof format);
    
    setSelectedFormat(format);
    updateFormData('data.0.format', format);
    
    // Clear layers field for formats that don't use layers
    if (format === 'xyz' || format === 'cog' || format === 'geojson' || format === 'flatgeobuf') {
      updateFormData('data.0.layers', '');
    }
    
    console.log('selectedFormat state should now be:', format);
    console.log('=======================================');
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedFormat('wms');
    setHasFeatureStatistics(false);
  };

  // Log current state whenever hook is called
  console.log('useSourceForm hook state - selectedFormat:', selectedFormat);

  return {
    selectedFormat,
    formData,
    hasFeatureStatistics,
    setHasFeatureStatistics,
    updateFormData,
    handleFormatChange,
    resetForm
  };
};
