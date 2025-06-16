
import { useState, useCallback } from 'react';
import { DataSource } from '@/types/config';

interface ValidationRule {
  name: string;
  required: boolean;
  validator?: (value: any) => boolean;
  message?: string;
}

interface UseLayerFormValidationProps {
  rules: ValidationRule[];
}

export const useLayerFormValidation = ({ rules }: UseLayerFormValidationProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((fieldName: string, value: any): boolean => {
    const rule = rules.find(r => r.name === fieldName);
    if (!rule) return true;

    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      setErrors(prev => ({ ...prev, [fieldName]: `${fieldName} is required` }));
      return false;
    }

    if (rule.validator && !rule.validator(value)) {
      setErrors(prev => ({ ...prev, [fieldName]: rule.message || `Invalid ${fieldName}` }));
      return false;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  }, [rules]);

  const validateForm = useCallback((data: Partial<DataSource>): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    rules.forEach(rule => {
      const value = getNestedValue(data, rule.name);
      
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[rule.name] = `${rule.name} is required`;
        isValid = false;
      } else if (rule.validator && value && !rule.validator(value)) {
        newErrors[rule.name] = rule.message || `Invalid ${rule.name}`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
};

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
