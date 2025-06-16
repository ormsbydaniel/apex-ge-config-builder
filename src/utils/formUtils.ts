
import React from 'react';

// Form validation helpers
export const validateFormField = (value: string, required: boolean = false): boolean => {
  if (required && !value.trim()) {
    return false;
  }
  return true;
};

export const sanitizeFormValue = (value: string): string => {
  return value.trim();
};

export const createFormFieldHandler = <T>(
  setState: (value: T) => void,
  transform?: (value: string) => T
) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setState(transform ? transform(value) : value as T);
  };
};

export const handleKeyPress = (
  e: React.KeyboardEvent,
  onEnter: () => void
) => {
  if (e.key === 'Enter') {
    onEnter();
  }
};
