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
import { Compass, FileText, Film, Layers as LayersIcon, Pencil, Plus, SlidersHorizontal } from 'lucide-react';
import { DataSource, StoryStep } from '@/types/config';
import { StoryWarning } from '@/utils/storyValidation';
import ActionsAndLayersSection from './actions/ActionsAndLayersSection';


interface StepEditorProps {
  step: StoryStep;
  sources: DataSource[];
  warnings?: StoryWarning[];
  onSave: (next: StoryStep) => void;
  /** When true, auto-open the Content dialog on mount (for newly added steps). */
  initiallyEditingContent?: boolean;
  /** Called if the user cancels the Content dialog on a new step — the parent
   *  should roll the step add back. */
  onCancelNewStep?: () => void;
}

/**
 * Editor for a single StoryStep.
 * All edits commit immediately via onSave (from the Content modal, per-action
 * modals, or the JSON modal). No local staging or Save/Cancel footer.
 */
export const StepEditor: React.FC<StepEditorProps> = ({
  step,
  sources,
  warnings,
  onSave,
  initiallyEditingContent,
  onCancelNewStep,
}) => {
  const [editingContent, setEditingContent] = useState<boolean>(!!initiallyEditingContent);
  const [contentDraftTitle, setContentDraftTitle] = useState(step.title);
  const [contentDraftId, setContentDraftId] = useState(step.id);
  const [contentDraftDescription, setContentDraftDescription] = useState(step.description ?? '');
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [hasSavedNewContent, setHasSavedNewContent] = useState(false);

  const slugify = (v: string) =>
    v.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  // Sync draft fields when opening the dialog.
  useEffect(() => {
    if (editingContent) {
      setContentDraftTitle(step.title);
      setContentDraftId(step.id);
      setContentDraftDescription(step.description ?? '');
      setIdManuallyEdited(step.id !== slugify(step.title));
    }
  }, [editingContent, step.title, step.id, step.description]);

  const openContentDialog = () => setEditingContent(true);

  const handleTitleChange = (v: string) => {
    setContentDraftTitle(v);
    if (!idManuallyEdited) setContentDraftId(slugify(v));
  };
  const handleIdChange = (v: string) => {
    setContentDraftId(v);
    setIdManuallyEdited(true);
  };

  const saveContentDialog = () => {
    const next: StoryStep = {
      ...step,
      title: contentDraftTitle.trim() || step.title,
      id: contentDraftId || slugify(contentDraftTitle),
      description: contentDraftDescription || undefined,
    };
    onSave(next);
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
      {/* Content label */}
      <div className="flex items-center gap-1.5 border-b pb-2">
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

      {/* Content body */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {step.description ? (
          <p className="whitespace-pre-wrap">{step.description}</p>
        ) : (
          <p className="italic">No description configured</p>
        )}
        <div>
          <span className="font-medium">ID:</span> {step.id}
        </div>
      </div>

      {/* Navigation */}
      <ActionsAndLayersSection
        step={step}
        sources={sources}
        warnings={warnings}
        onChange={onSave}
        allowedKinds={['navigation']}
        title="Navigation"
        headerIcon={<Compass className="h-4 w-4 text-muted-foreground" />}
        addLabel="Navigation settings"
      />

      {/* Layers */}
      <ActionsAndLayersSection
        step={step}
        sources={sources}
        warnings={warnings}
        onChange={onSave}
        allowedKinds={['activeLayers', 'focusLayer']}
        title="Layers"
        headerIcon={<LayersIcon className="h-4 w-4 text-muted-foreground" />}
        addLabel="Layer settings"
      />

      {/* Actions */}
      <ActionsAndLayersSection
        step={step}
        sources={sources}
        warnings={warnings}
        onChange={onSave}
        allowedKinds={['layerControl', 'expandPanels']}
        title="Actions"
        headerIcon={<SlidersHorizontal className="h-4 w-4 text-muted-foreground" />}
        addLabel="Add action"
      />


      <Dialog open={editingContent} onOpenChange={handleContentOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="step-title">Title</Label>
              <Input
                id="step-title"
                autoFocus
                value={contentDraftTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Step title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-description">Description (markdown)</Label>
              <Textarea
                id="step-description"
                rows={14}
                value={contentDraftDescription}
                onChange={(e) => setContentDraftDescription(e.target.value)}
                placeholder="Step description..."
                className="min-h-[320px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-id">ID</Label>
              <Input
                id="step-id"
                value={contentDraftId}
                onChange={(e) => handleIdChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-derived from the title as a slug. Edit to override.
              </p>
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

    </div>
  );
};

export default StepEditor;
