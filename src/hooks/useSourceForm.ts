
import { useState } from 'react';
import { DataSource, SourceConfigType } from '@/types/config';

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
    contentLocation: 'infoPanel',
    layerCard: {
      toggleable: true,
      controls: {
        opacitySlider: true,
        zoomToCenter: true
      }
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
  const [selectedFormat, setSelectedFormat] = useState<SourceConfigType>('wms');
  const [formData, setFormData] = useState<DataSource>(initialFormState);
  const [hasFeatureStatistics, setHasFeatureStatistics] = useState(false);

  const updateFormData = (path: string, value: any) => {
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

  const handleFormatChange = (format: SourceConfigType) => {
    setSelectedFormat(format);
    
    // For S3, don't set format in data - it will be determined by file extension
    if (format !== 's3') {
      updateFormData('data.0.format', format);
    }
    
    // Clear layers field for formats that don't use layers
    if (format === 'xyz' || format === 'cog' || format === 'geojson' || format === 'flatgeobuf' || format === 's3') {
      updateFormData('data.0.layers', '');
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedFormat('wms');
    setHasFeatureStatistics(false);
  };

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
