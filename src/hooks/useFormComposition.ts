import { useState, useCallback } from 'react';
import { validateFormField } from '@/utils/formUtils';

interface FormFieldConfig {
  name: string;
  required?: boolean;
  validator?: (value: any) => boolean;
}

interface UseFormCompositionProps {
  initialData: Record<string, any>;
  fields: FormFieldConfig[];
  onSubmit?: (data: Record<string, any>) => void;
}

export const useFormComposition = ({
  initialData,
  fields,
  onSubmit
}: UseFormCompositionProps) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    
    setIsDirty(true);
    
    // Clear error for this field if it becomes valid
    const fieldConfig = fields.find(f => f.name === path);
    if (fieldConfig) {
      const stringValue = String(value || '');
      const isValid = fieldConfig.validator ? fieldConfig.validator(value) : validateFormField(stringValue, fieldConfig.required);
      if (isValid && errors[path]) {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[path];
          return updated;
        });
      }
    }
  }, [fields, errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const keys = field.name.split('.');
      let value = formData;
      
      for (const key of keys) {
        value = value?.[key];
      }
      
      const stringValue = String(value || '');
      const isValid = field.validator ? field.validator(value) : validateFormField(stringValue, field.required);
      
      if (!isValid) {
        newErrors[field.name] = field.required ? 'This field is required' : 'Invalid value';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, fields]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      onSubmit(formData);
    }
  }, [formData, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isDirty,
    updateField,
    validateForm,
    handleSubmit,
    resetForm
  };
};
