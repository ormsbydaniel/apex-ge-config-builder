import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { WorkflowItem } from '@/types/config';
import { toast } from 'sonner';

interface WorkflowEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow?: WorkflowItem; // Undefined for new workflows
  onSave: (workflow: WorkflowItem) => void;
}

const DEFAULT_WORKFLOW_TEMPLATE: WorkflowItem = {
  zIndex: 10,
  service: "",
  label: ""
};

export function WorkflowEditorDialog({ 
  open, 
  onOpenChange, 
  workflow, 
  onSave 
}: WorkflowEditorDialogProps) {
  const [editedJson, setEditedJson] = useState<string>(
    JSON.stringify(workflow || DEFAULT_WORKFLOW_TEMPLATE, null, 2)
  );

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
    onOpenChange(false);
    // Reset to original when dialog reopens
    setEditedJson(JSON.stringify(workflow || DEFAULT_WORKFLOW_TEMPLATE, null, 2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
