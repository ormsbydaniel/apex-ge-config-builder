import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Compass, FileText, Layers as LayersIcon, Pencil, PanelRightOpen,
} from 'lucide-react';
import { DataSource, StoryStep } from '@/types/config';
import { StoryWarning } from '@/utils/storyValidation';
import ActionsAndLayersSection from './actions/ActionsAndLayersSection';
import type { CopyFacet } from './copySteps';

interface StepEditorProps {
  step: StoryStep;
  sources: DataSource[];
  warnings?: StoryWarning[];
  onSave: (next: StoryStep) => void;
  initiallyEditingContent?: boolean;
  onCancelNewStep?: () => void;
  onCopyAction?: (facet: CopyFacet) => void;
}

const slugify = (v: string) =>
  v.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Editor for a single v2 StoryStep. All edits commit immediately via onSave.
 */
export const StepEditor: React.FC<StepEditorProps> = ({
  step, sources, warnings, onSave,
  initiallyEditingContent, onCancelNewStep, onCopyAction,
}) => {
  const [editingContent, setEditingContent] = useState<boolean>(!!initiallyEditingContent);
  const [draftTitle, setDraftTitle] = useState(step.content?.title ?? '');
  const [draftId, setDraftId] = useState(step.id);
  const [draftDescription, setDraftDescription] = useState(step.content?.description ?? '');
  const [draftAutoAdvance, setDraftAutoAdvance] = useState<string>(
    step.autoAdvance !== undefined ? String(step.autoAdvance) : '',
  );
  const [hasSavedNewContent, setHasSavedNewContent] = useState(false);

  useEffect(() => {
    if (editingContent) {
      setDraftTitle(step.content?.title ?? '');
      setDraftId(step.id);
      setDraftDescription(step.content?.description ?? '');
      setDraftAutoAdvance(step.autoAdvance !== undefined ? String(step.autoAdvance) : '');
    }
  }, [editingContent, step]);

  const openContentDialog = () => setEditingContent(true);

  const handleTitleChange = (v: string) => {
    setDraftTitle(v);
    setDraftId(slugify(v));
  };

  const saveContentDialog = () => {
    const title = draftTitle.trim();
    const description = draftDescription.trim();
    const next: StoryStep = {
      ...step,
      id: draftId || slugify(draftTitle) || step.id,
      content: (title || description)
        ? {
            ...(title && { title }),
            ...(description && { description }),
          }
        : undefined,
      autoAdvance: draftAutoAdvance === '' ? undefined : Number(draftAutoAdvance),
    };
    onSave(next);
    setHasSavedNewContent(true);
    setEditingContent(false);
  };

  const handleContentOpenChange = (open: boolean) => {
    if (!open && initiallyEditingContent && !hasSavedNewContent) {
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
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Content</h4>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
          onClick={openContentDialog} title="Edit content">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {step.content?.description ? (
          <p className="whitespace-pre-wrap">{step.content.description}</p>
        ) : (
          <p className="italic">No description configured</p>
        )}
        <div><span className="font-medium">ID:</span> {step.id}</div>
        {step.autoAdvance !== undefined && (
          <div><span className="font-medium">Auto-advance:</span> {step.autoAdvance}ms</div>
        )}
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
        onCopyAction={onCopyAction}
      />

      {/* Active layers */}
      <ActionsAndLayersSection
        step={step}
        sources={sources}
        warnings={warnings}
        onChange={onSave}
        allowedKinds={['activeLayers', 'baseLayer', 'constraints']}
        title="Layers"
        headerIcon={<LayersIcon className="h-4 w-4 text-muted-foreground" />}
        addLabel="Layer settings"
        onCopyAction={onCopyAction}
      />

      {/* Panel state */}
      <ActionsAndLayersSection
        step={step}
        sources={sources}
        warnings={warnings}
        onChange={onSave}
        allowedKinds={['panelState']}
        title="Panels"
        headerIcon={<PanelRightOpen className="h-4 w-4 text-muted-foreground" />}
        addLabel="Panel state"
        onCopyAction={onCopyAction}
      />

      <Dialog open={editingContent} onOpenChange={handleContentOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="step-title">Title</Label>
              <Input id="step-title" autoFocus value={draftTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Step title..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-description">Description (markdown)</Label>
              <MarkdownEditor id="step-description" rows={14}
                value={draftDescription} onChange={setDraftDescription}
                placeholder="Step description..." textareaClassName="min-h-[320px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="step-id">ID</Label>
                <Input id="step-id" value={draftId} onChange={(e) => setDraftId(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Auto-derived from the title as a slug. Edit to override.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="step-auto-advance">Auto-advance (ms)</Label>
                <Input id="step-auto-advance" type="number" min={0}
                  value={draftAutoAdvance}
                  onChange={(e) => setDraftAutoAdvance(e.target.value)}
                  placeholder="Optional" />
                <p className="text-xs text-muted-foreground">
                  Advance to the next step after this many milliseconds.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleContentOpenChange(false)}>Cancel</Button>
            <Button onClick={saveContentDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepEditor;
