/**
 * Fields Editor Dialog component.
 * Allows managing field configurations for vector layers.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FieldsConfig, FieldConfig } from '@/types/category';
import { DataSource } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useFieldsEditorState } from '@/hooks/useFieldsEditorState';
import FieldsEditorTabs from './FieldsEditorTabs';
import { isVectorFormat } from '@/utils/fieldDetection';

interface FieldsEditorDialogProps {
  fields: FieldsConfig;
  onUpdate: (fields: FieldsConfig) => void;
  trigger: React.ReactNode;
  sourceUrl?: string;
  sourceFormat?: string;
}

const FieldsEditorDialog = ({
  fields,
  onUpdate,
  trigger,
  sourceUrl,
  sourceFormat
}: FieldsEditorDialogProps) => {
  const { config } = useConfig();

  // Find layers with fields (excluding current layer being edited)
  const availableSourceLayers = config.sources
    .filter((source: DataSource) => 
      source.meta?.fields && 
      Object.keys(source.meta.fields).length > 0
    )
    .map((source: DataSource) => ({
      name: source.name,
      fields: source.meta?.fields || {}
    }));

  const {
    open,
    activeTab,
    localFields,
    selectedSourceLayer,
    showAppendReplaceDialog,
    pendingCopyData,
    newFieldName,
    setActiveTab,
    setLocalFields,
    setSelectedSourceLayer,
    setShowAppendReplaceDialog,
    setPendingCopyData,
    setNewFieldName,
    handleOpen,
    handleCancel,
    updateField,
    removeField,
    addField,
    performCopy,
    importDetectedFields
  } = useFieldsEditorState({ fields, availableSourceLayers });

  const handleAdd = () => {
    handleOpen(true);
  };

  const handleSave = () => {
    onUpdate(localFields);
    handleOpen(false);
  };

  const handleCopyFromLayer = () => {
    const sourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);
    if (!sourceLayerData) return;

    const localFieldCount = Object.keys(localFields).length;
    if (localFieldCount > 0) {
      setPendingCopyData(sourceLayerData);
      setShowAppendReplaceDialog(true);
    } else {
      performCopy(sourceLayerData, 'replace');
    }
  };

  // Check if there are any changes to save
  const hasChanges = JSON.stringify(localFields) !== JSON.stringify(fields);
  const canSave = hasChanges;
  const fieldCount = Object.keys(localFields).length;

  return (
    <>
      <div onClick={() => handleAdd()}>
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Fields</DialogTitle>
          </DialogHeader>
          
          <FieldsEditorTabs
            activeTab={activeTab}
            localFields={localFields}
            availableSourceLayers={availableSourceLayers}
            selectedSourceLayer={selectedSourceLayer}
            sourceUrl={sourceUrl}
            sourceFormat={sourceFormat}
            newFieldName={newFieldName}
            onActiveTabChange={setActiveTab}
            onSetLocalFields={setLocalFields}
            onSetSelectedSourceLayer={setSelectedSourceLayer}
            onCopyFromLayer={handleCopyFromLayer}
            onSetNewFieldName={setNewFieldName}
            onAddField={addField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onImportDetectedFields={importDetectedFields}
          />

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button onClick={handleSave} disabled={!canSave}>
                      Save Changes
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSave && (
                  <TooltipContent>
                    <p>No changes to save</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Append/Replace Confirmation Dialog */}
      <AlertDialog open={showAppendReplaceDialog} onOpenChange={setShowAppendReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How would you like to copy the fields?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have {Object.keys(localFields).length} field(s) configured. Would you like to replace them or append the new ones?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAppendReplaceDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingCopyData && performCopy(pendingCopyData, 'append')}>
              Append ({pendingCopyData ? Object.keys(pendingCopyData.fields).length : 0} more)
            </AlertDialogAction>
            <AlertDialogAction onClick={() => pendingCopyData && performCopy(pendingCopyData, 'replace')}>
              Replace (with {pendingCopyData ? Object.keys(pendingCopyData.fields).length : 0})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FieldsEditorDialog;
