
import { useState, useCallback } from 'react';

export const useJsonEditor = (initialJson: string) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedJson, setEditedJson] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);

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

  const toggleSplitView = useCallback(() => {
    setIsSplitView(!isSplitView);
  }, [isSplitView]);

  return {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    isSplitView,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson,
    toggleSplitView,
  };
};
