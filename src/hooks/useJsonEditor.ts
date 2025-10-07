
import { useState, useCallback } from 'react';

export const useJsonEditor = (initialJson: string) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedJson, setEditedJson] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleEditModeToggle = useCallback(() => {
    if (!isEditMode) {
      setEditedJson(initialJson);
      setHasUnsavedChanges(false);
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, initialJson]);

  const handleJsonChange = useCallback((value: string | undefined) => {
    const newValue = value || '';
    setEditedJson(newValue);
    setHasUnsavedChanges(newValue !== initialJson);
  }, [initialJson]);

  const handleReset = useCallback(() => {
    setEditedJson(initialJson);
    setHasUnsavedChanges(false);
  }, [initialJson]);

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(editedJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditedJson(formatted);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [editedJson]);

  const handleFind = useCallback((query: string) => {
    // This will be handled by the Monaco editor
  }, []);

  const handleReplace = useCallback((searchValue: string, replaceValue: string, replaceAll: boolean) => {
    try {
      if (replaceAll) {
        const regex = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const updated = editedJson.replace(regex, replaceValue);
        setEditedJson(updated);
        setHasUnsavedChanges(updated !== initialJson);
      } else {
        const updated = editedJson.replace(searchValue, replaceValue);
        setEditedJson(updated);
        setHasUnsavedChanges(updated !== initialJson);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [editedJson, initialJson]);

  return {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson,
    handleFind,
    handleReplace,
  };
};
