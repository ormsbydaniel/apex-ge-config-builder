/**
 * State management hook for the Fields Editor dialog.
 * Follows the pattern established by useColormapEditorState.
 */

import { useState } from 'react';
import { FieldsConfig, FieldConfig } from '@/types/category';
import { useToast } from '@/hooks/use-toast';

interface AvailableSourceLayer {
  name: string;
  fields: FieldsConfig;
}

interface UseFieldsEditorStateProps {
  fields: FieldsConfig;
  availableSourceLayers: AvailableSourceLayer[];
}

export const useFieldsEditorState = ({ 
  fields, 
  availableSourceLayers 
}: UseFieldsEditorStateProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [localFields, setLocalFields] = useState<FieldsConfig>({ ...fields });
  const [selectedSourceLayer, setSelectedSourceLayer] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showAppendReplaceDialog, setShowAppendReplaceDialog] = useState(false);
  const [pendingCopyData, setPendingCopyData] = useState<AvailableSourceLayer | null>(null);

  // Current field being edited
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState<string>('');

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !activeTab) {
      setActiveTab("define");
    }
  };

  const handleCancel = () => {
    setLocalFields({ ...fields });
    setActiveTab('');
    setSelectedSourceLayer('');
    setEditingFieldName(null);
    setNewFieldName('');
    setOpen(false);
  };

  const updateField = (fieldName: string, config: FieldConfig | null) => {
    setLocalFields(prev => ({
      ...prev,
      [fieldName]: config
    }));
  };

  const removeField = (fieldName: string) => {
    setLocalFields(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const addField = (fieldName: string, config: FieldConfig = {}) => {
    if (!fieldName.trim()) return;
    setLocalFields(prev => ({
      ...prev,
      [fieldName]: config
    }));
    setNewFieldName('');
  };

  const toggleFieldHidden = (fieldName: string) => {
    setLocalFields(prev => {
      const current = prev[fieldName];
      return {
        ...prev,
        [fieldName]: current === null ? {} : null
      };
    });
  };

  const performCopy = (
    sourceLayer: AvailableSourceLayer, 
    mode: 'append' | 'replace'
  ) => {
    const copiedFields = { ...sourceLayer.fields };
    
    let finalFields: FieldsConfig;
    if (mode === 'append') {
      finalFields = { ...localFields, ...copiedFields };
    } else {
      finalFields = copiedFields;
    }
    
    setLocalFields(finalFields);
    setShowAppendReplaceDialog(false);
    setPendingCopyData(null);
    setActiveTab('define');
    
    const fieldCount = Object.keys(copiedFields).length;
    const actionText = mode === 'append' ? 'Appended' : 'Copied';
    toast({
      title: `Fields ${actionText}`,
      description: `${actionText} ${fieldCount} fields from "${sourceLayer.name}".`,
    });
  };

  const importDetectedFields = (fieldNames: string[], mode: 'append' | 'replace') => {
    const newFields: FieldsConfig = {};
    fieldNames.forEach(name => {
      newFields[name] = {};
    });

    let finalFields: FieldsConfig;
    if (mode === 'append') {
      finalFields = { ...localFields, ...newFields };
    } else {
      finalFields = newFields;
    }

    setLocalFields(finalFields);
    setActiveTab('define');

    toast({
      title: 'Fields Imported',
      description: `Imported ${fieldNames.length} fields from source.`,
    });
  };

  return {
    // State
    open,
    activeTab,
    localFields,
    selectedSourceLayer,
    isDetecting,
    showAppendReplaceDialog,
    pendingCopyData,
    editingFieldName,
    newFieldName,
    
    // State setters
    setActiveTab,
    setLocalFields,
    setSelectedSourceLayer,
    setIsDetecting,
    setShowAppendReplaceDialog,
    setPendingCopyData,
    setEditingFieldName,
    setNewFieldName,
    
    // Handlers
    handleOpen,
    handleCancel,
    updateField,
    removeField,
    addField,
    toggleFieldHidden,
    performCopy,
    importDetectedFields
  };
};
