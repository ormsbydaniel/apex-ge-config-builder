import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, X, FileJson } from 'lucide-react';
import { StoryStep } from '@/types/config';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { useToast } from '@/hooks/use-toast';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import JsonEditorToolbar from '@/components/config/components/JsonEditorToolbar';
import { StoryStepV2Schema } from '@/schemas/storySchema';

interface StepJsonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  step: StoryStep;
  onSave: (updated: StoryStep) => void;
}

const StepJsonEditorDialog: React.FC<StepJsonEditorDialogProps> = ({
  isOpen,
  onClose,
  step,
  onSave,
}) => {
  const { toast } = useToast();
  const stepJson = JSON.stringify(step, null, 2);

  const {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson,
  } = useJsonEditor(stepJson);

  const handleApplyChanges = () => {
    try {
      const parsed = JSON.parse(editedJson);
      const result = StoryStepSchema.safeParse(parsed);
      if (!result.success) {
        const first = result.error.issues[0];
        throw new Error(
          `${first.path.join('.') || 'step'}: ${first.message}`,
        );
      }
      onSave(result.data as StoryStep);
      const stepTitle =
        (result.data as { content?: { title?: string } }).content?.title ??
        (result.data as { id?: string }).id ??
        'step';
      toast({
        title: 'Step Updated',
        description: `Step "${stepTitle}" has been updated successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description:
          error instanceof Error
            ? error.message
            : 'Please check your JSON syntax and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?',
      );
      if (!confirmDiscard) return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Edit Step JSON: {step.content?.title ?? step.id}
          </DialogTitle>
          <DialogDescription>
            Edit the JSON configuration for this step. Changes are validated
            against the step schema before being applied.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!isEditMode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Read-only view
                </span>
                <Button onClick={handleEditModeToggle} variant="outline">
                  Enable Editing
                </Button>
              </div>
              <div
                className="overflow-auto"
                style={{ height: 'calc(85vh - 250px)' }}
              >
                <MonacoJsonEditor
                  value={stepJson}
                  readOnly
                  height="calc(85vh - 250px)"
                />
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
              <div
                className="overflow-auto"
                style={{ height: 'calc(85vh - 290px)' }}
              >
                <MonacoJsonEditor
                  value={editedJson}
                  onChange={handleJsonChange}
                  readOnly={false}
                  height="calc(85vh - 290px)"
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

export default StepJsonEditorDialog;
