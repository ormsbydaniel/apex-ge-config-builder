
import { useState, useCallback } from 'react';
import { DataSource } from '@/types/config';

interface UseFormDataProps {
  initialData: Partial<DataSource>;
}

export const useFormData = ({ initialData }: UseFormDataProps) => {
  const [formData, setFormData] = useState<Partial<DataSource>>(initialData);
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      setNestedValue(newData, path, value);
      return newData;
    });
    setIsDirty(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);
  }, [initialData]);

  const updateFormData = useCallback((updates: Partial<DataSource>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  return {
    formData,
    isDirty,
    updateField,
    resetForm,
    updateFormData
  };
};

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}
