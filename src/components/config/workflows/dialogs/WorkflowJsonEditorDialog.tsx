import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, X, FileJson } from 'lucide-react';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { useToast } from '@/hooks/use-toast';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import JsonEditorToolbar from '@/components/config/components/JsonEditorToolbar';
import { WorkflowItem } from '@/types/dataSource';

interface WorkflowJsonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowItem;
  onSave: (updated: WorkflowItem) => void;
}

const WorkflowJsonEditorDialog = ({ isOpen, onClose, workflow, onSave }: WorkflowJsonEditorDialogProps) => {
  const { toast } = useToast();
  const workflowJson = JSON.stringify(workflow, null, 2);

  const {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson,
  } = useJsonEditor(workflowJson);

  const handleApplyChanges = () => {
    try {
      const parsed = JSON.parse(editedJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Algorithm must be a JSON object');
      }
      if (!parsed.serviceId || typeof parsed.serviceId !== 'string') {
        throw new Error('Algorithm is missing a string `serviceId`');
      }
      onSave(parsed as WorkflowItem);
      toast({
        title: 'Workflow updated',
        description: `"${parsed.serviceId}" saved.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: error instanceof Error ? error.message : 'Please check your JSON syntax and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!confirmDiscard) return;
    }
    onClose();
  };

  const title = workflow.serviceId || '(unnamed workflow)';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Edit Workflow JSON: {title}
          </DialogTitle>
          <DialogDescription>
            Edit the JSON configuration for this workflow. Changes will be applied to your configuration when saved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!isEditMode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Read-only view</span>
                <Button onClick={handleEditModeToggle} variant="outline">
                  Enable Editing
                </Button>
              </div>
              <div className="overflow-auto" style={{ height: 'calc(80vh - 250px)' }}>
                <MonacoJsonEditor value={workflowJson} readOnly height="calc(80vh - 250px)" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <JsonEditorToolbar
                hasUnsavedChanges={hasUnsavedChanges}
                onApplyChanges={handleApplyChanges}
                onReset={handleReset}
                onFormatJson={formatJson}
              />
              <div className="overflow-auto" style={{ height: 'calc(80vh - 290px)' }}>
                <MonacoJsonEditor
                  value={editedJson}
                  onChange={handleJsonChange}
                  readOnly={false}
                  height="calc(80vh - 290px)"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {isEditMode && (
            <Button onClick={handleApplyChanges} disabled={!hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowJsonEditorDialog;
