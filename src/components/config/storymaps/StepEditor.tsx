import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Film, Pencil, Plus } from 'lucide-react';
import { DataSource, StoryStep } from '@/types/config';
import { StoryWarning } from '@/utils/storyValidation';
import ActionsAndLayersSection from './actions/ActionsAndLayersSection';

interface StepEditorProps {
  step: StoryStep;
  sources: DataSource[];
  warnings?: StoryWarning[];
  onSave: (next: StoryStep) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** When true, auto-open the Content dialog on mount (for newly added steps). */
  initiallyEditingContent?: boolean;
  /** Called if the user cancels the Content dialog on a new step — the parent
   *  should roll the step add back. */
  onCancelNewStep?: () => void;
}

/**
 * Editor for a single StoryStep.
 * Local state is held here; commits happen on Save via a single onSave dispatch
 * (Core memory: single onSave, init inside effect on the trigger prop).
 */
export const StepEditor: React.FC<StepEditorProps> = ({
  step,
  sources,
  warnings,
  onSave,
  onCancel,
  onDirtyChange,
  initiallyEditingContent,
  onCancelNewStep,
}) => {
  const [working, setWorking] = useState<StoryStep>(step);
  const [editingContent, setEditingContent] = useState<boolean>(!!initiallyEditingContent);
  const [contentDraftId, setContentDraftId] = useState(step.id);
  const [contentDraftDescription, setContentDraftDescription] = useState(step.description ?? '');
  const [hasSavedNewContent, setHasSavedNewContent] = useState(false);

  // Reset when the incoming step reference changes.
  useEffect(() => {
    setWorking(step);
  }, [step]);

  // Sync draft fields when opening the dialog.
  useEffect(() => {
    if (editingContent) {
      setContentDraftId(working.id);
      setContentDraftDescription(working.description ?? '');
    }
  }, [editingContent, working.id, working.description]);

  const dirty = JSON.stringify(working) !== JSON.stringify(step);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const patch = (p: Partial<StoryStep>) => setWorking((prev) => ({ ...prev, ...p }));

  const openContentDialog = () => setEditingContent(true);

  const saveContentDialog = () => {
    patch({
      id: contentDraftId,
      description: contentDraftDescription || undefined,
    });
    setHasSavedNewContent(true);
    setEditingContent(false);
  };

  const handleContentOpenChange = (open: boolean) => {
    if (!open && initiallyEditingContent && !hasSavedNewContent) {
      // Cancel on a brand-new step — ask parent to roll back the add
      onCancelNewStep?.();
      return;
    }
    setEditingContent(open);
  };

  return (
    <div className="space-y-3 pt-3">
      {/* Combined header row: Content + Actions & Layers labels side-by-side */}
      <ActionsAndLayersSection
        step={working}
        sources={sources}
        warnings={warnings}
        onChange={(next) => setWorking(next)}
        bare
        renderHeader={({ count, onAdd }) => (
          <div className="flex items-center gap-2 flex-wrap border-b pb-2">
            {/* Content label group */}
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Content
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={openContentDialog}
                title="Edit content"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Actions & Layers label group */}
            <div className="flex items-center gap-1.5">
              <Film className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Actions &amp; Layers
              </h4>
              {count > 0 && (
                <span className="text-xs text-muted-foreground">({count})</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={onAdd}
              >
                <Plus className="h-3 w-3 mr-1" /> Add action
              </Button>
            </div>
          </div>
        )}
      >
      </ActionsAndLayersSection>

      {/* Content body */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {working.description ? (
          <p className="whitespace-pre-wrap">{working.description}</p>
        ) : (
          <p className="italic">No description configured</p>
        )}
        <div>
          <span className="font-medium">ID:</span> {working.id}
        </div>
      </div>

      <Dialog open={editingContent} onOpenChange={handleContentOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="step-id">ID</Label>
              <Input
                id="step-id"
                value={contentDraftId}
                onChange={(e) => setContentDraftId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-description">Description (markdown)</Label>
              <Textarea
                id="step-description"
                rows={8}
                value={contentDraftDescription}
                onChange={(e) => setContentDraftDescription(e.target.value)}
                placeholder="Step description..."
                className="min-h-[180px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleContentOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={saveContentDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!dirty} onClick={() => onSave(working)}>
          Save step
        </Button>
      </div>
    </div>
  );
};

export default StepEditor;
