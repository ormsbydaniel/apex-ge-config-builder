import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { WorkflowItem } from '@/types/config';
import { toast } from 'sonner';
import { useConfig } from '@/contexts/ConfigContext';

interface WorkflowEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow?: WorkflowItem; // Undefined for new workflows
  onSave: (workflow: WorkflowItem) => void;
}

const DEFAULT_WORKFLOW_TEMPLATE: WorkflowItem = {
  zIndex: 50,
  service: "",
  label: ""
};

export function WorkflowEditorDialog({ 
  open, 
  onOpenChange, 
  workflow, 
  onSave 
}: WorkflowEditorDialogProps) {
  const { dispatch } = useConfig();
  const [editedJson, setEditedJson] = useState<string>(
    JSON.stringify(workflow || DEFAULT_WORKFLOW_TEMPLATE, null, 2)
  );
  const [initialJson, setInitialJson] = useState<string>(
    JSON.stringify(workflow || DEFAULT_WORKFLOW_TEMPLATE, null, 2)
  );
  const prevOpenRef = useRef(open);

  // Only update editedJson when dialog transitions from closed to open
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const json = JSON.stringify(workflow || DEFAULT_WORKFLOW_TEMPLATE, null, 2);
      setEditedJson(json);
      setInitialJson(json);
    }
    prevOpenRef.current = open;
  }, [open, workflow]);

  // Track dirty state and update ConfigContext
  useEffect(() => {
    if (open && editedJson !== initialJson) {
      const description = workflow?.label ? `Workflow: ${workflow.label}` : 'Workflow: New Workflow';
      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: true, description }
      });
    }
  }, [open, editedJson, initialJson, workflow, dispatch]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedJson);
      
      // Validate required fields
      if (typeof parsed.zIndex !== 'number') {
        toast.error('Validation Error', {
          description: 'Field "zIndex" must be a number'
        });
        return;
      }
      
      if (typeof parsed.service !== 'string' || !parsed.service.trim()) {
        toast.error('Validation Error', {
          description: 'Field "service" is required and must be a non-empty string'
        });
        return;
      }
      
      if (typeof parsed.label !== 'string' || !parsed.label.trim()) {
        toast.error('Validation Error', {
          description: 'Field "label" is required and must be a non-empty string'
        });
        return;
      }

      // Clear unsaved changes flag
      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: false, description: null }
      });

      onSave(parsed as WorkflowItem);
      onOpenChange(false);
      toast.success(workflow ? 'Workflow updated successfully' : 'Workflow added successfully');
    } catch (error) {
      toast.error('Invalid JSON', {
        description: error instanceof Error ? error.message : 'Failed to parse JSON'
      });
    }
  };

  const handleCancel = () => {
    // Clear unsaved changes flag
    dispatch({
      type: 'SET_UNSAVED_FORM_CHANGES',
      payload: { hasChanges: false, description: null }
    });

    onOpenChange(false);
    // Reset to original when dialog reopens
    setEditedJson(JSON.stringify(workflow || DEFAULT_WORKFLOW_TEMPLATE, null, 2));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear unsaved changes flag when closing dialog
      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: false, description: null }
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {workflow ? 'Edit Workflow' : 'Add Workflow'}
          </DialogTitle>
          <DialogDescription>
            {workflow 
              ? 'Modify the workflow JSON. Required fields: zIndex (number), service (string), label (string).'
              : 'Define a new workflow. Required fields: zIndex (number), service (string), label (string). You can add arbitrary additional properties.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
          <MonacoJsonEditor
            value={editedJson}
            onChange={setEditedJson}
            height="500px"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {workflow ? 'Update Workflow' : 'Add Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
