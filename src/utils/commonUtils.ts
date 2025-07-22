/**
 * Common utility functions consolidated for better maintainability
 * Phase 1 Refactoring: Extract and consolidate utility functions
 */

// Array manipulation utilities
export const moveArrayItem = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
};

export const removeArrayItem = <T>(array: T[], index: number): T[] => {
  return array.filter((_, i) => i !== index);
};

export const updateArrayItem = <T>(array: T[], index: number, newItem: T): T[] => {
  return array.map((item, i) => (i === index ? newItem : item));
};

// String utilities
export const sanitizeString = (value: string): string => {
  return value.trim();
};

export const isValidString = (value: string, required: boolean = false): boolean => {
  if (required && !value.trim()) {
    return false;
  }
  return true;
};

export const generateUniqueId = (prefix: string = 'item'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const mergeObjects = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  return { ...target, ...source };
};

// Validation utilities
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateStringLength = (value: string, minLength: number, maxLength: number, fieldName: string): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
};

// Index utilities for safe array access
export const isValidIndex = (index: number, arrayLength: number): boolean => {
  return index >= 0 && index < arrayLength;
};

export const getValidIndex = (index: number, arrayLength: number): number | null => {
  return isValidIndex(index, arrayLength) ? index : null;
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};