
import { useState, useCallback } from 'react';

export const useJsonEditor = (initialJson: string) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedJson, setEditedJson] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');

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

  const toggleFindReplace = useCallback(() => {
    setShowFindReplace(!showFindReplace);
  }, [showFindReplace]);

  const handleFind = useCallback(() => {
    // The actual find will be handled by Monaco editor via searchValue
  }, []);

  const handleReplace = useCallback(() => {
    if (!searchValue) return;
    
    try {
      const index = editedJson.indexOf(searchValue);
      if (index !== -1) {
        const updated = editedJson.substring(0, index) + 
                       replaceValue + 
                       editedJson.substring(index + searchValue.length);
        setEditedJson(updated);
        setHasUnsavedChanges(updated !== initialJson);
      }
    } catch (error) {
      console.error('Replace error:', error);
    }
  }, [editedJson, initialJson, searchValue, replaceValue]);

  const handleReplaceAll = useCallback(() => {
    if (!searchValue) return;
    
    try {
      const regex = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const updated = editedJson.replace(regex, replaceValue);
      setEditedJson(updated);
      setHasUnsavedChanges(updated !== initialJson);
    } catch (error) {
      console.error('Replace all error:', error);
    }
  }, [editedJson, initialJson, searchValue, replaceValue]);

  return {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    showFindReplace,
    searchValue,
    replaceValue,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson,
    toggleFindReplace,
    setSearchValue,
    setReplaceValue,
    handleFind,
    handleReplace,
    handleReplaceAll,
  };
};
