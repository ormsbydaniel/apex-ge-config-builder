
import React from 'react';
import { FormFieldConfig } from '@/types/common';

/**
 * Enhanced form utilities for better form handling and validation
 * Phase 1 Refactoring: Consolidated form utilities with improved validation
 */

// Form validation result interface
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Enhanced form validation
export const validateFormField = (
  value: any, 
  config: Partial<FormFieldConfig>
): ValidationResult => {
  const { required = false, validation } = config;
  
  // Check required validation
  if (required && (value === null || value === undefined || value === '')) {
    return { isValid: false, message: `${config.label || 'Field'} is required` };
  }
  
  // Run custom validation if provided
  if (validation && value !== null && value !== undefined && value !== '') {
    const customValidationMessage = validation(value);
    if (customValidationMessage) {
      return { isValid: false, message: customValidationMessage };
    }
  }
  
  return { isValid: true };
};

// Legacy validation function for backward compatibility
export const validateFormFieldLegacy = (value: string, required: boolean = false): boolean => {
  return validateFormField(value, { required }).isValid;
};

// Enhanced form value sanitization
export const sanitizeFormValue = (value: string): string => {
  return value.trim().replace(/\s+/g, ' '); // Also normalize whitespace
};

// Enhanced form field handler with validation
export const createFormFieldHandler = <T>(
  setState: (value: T) => void,
  config?: {
    transform?: (value: string) => T;
    validate?: (value: T) => boolean;
    onValidationError?: (error: string) => void;
  }
) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const rawValue = e.target.value;
    const transformedValue = config?.transform ? config.transform(rawValue) : rawValue as T;
    
    // Run validation if provided
    if (config?.validate && !config.validate(transformedValue)) {
      config.onValidationError?.('Invalid value');
      return;
    }
    
    setState(transformedValue);
  };
};

// Enhanced keyboard event handler
export const handleKeyPress = (
  e: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onEscape?: () => void;
    onTab?: () => void;
  }
) => {
  switch (e.key) {
    case 'Enter':
      handlers.onEnter?.();
      break;
    case 'Escape':
      handlers.onEscape?.();
      break;
    case 'Tab':
      handlers.onTab?.();
      break;
  }
};

// Form data validation utility
export const validateFormData = (
  data: Record<string, any>,
  fieldConfigs: FormFieldConfig[]
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const config of fieldConfigs) {
    const value = data[config.name];
    const validation = validateFormField(value, config);
    
    if (!validation.isValid && validation.message) {
      errors[config.name] = validation.message;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
