import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StoryImportPanel, {
  type StoryImportSelection,
} from '@/components/config/storymaps/import/StoryImportPanel';
import { Story } from '@/types/config';

interface StoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Story | null;
  existingIds: string[];
  onSave: (patch: { id: string; title: string; description?: string; isActive?: boolean; thumbnail?: string }) => void;
  /** Source ids already present in the working configuration (import tab). */
  existingSourceIds?: string[];
  /** When provided, an "Import story" tab is shown in add mode. */
  onImportStories?: (selection: StoryImportSelection) => void;
}


const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'story';

const uniqueId = (base: string, existing: string[]): string => {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};

/**
 * Add / edit a story's own metadata (id, title, description). Body content
 * (steps) is edited inline on the story card.
 */
export const StoryFormDialog: React.FC<StoryFormDialogProps> = ({
  open,
  onOpenChange,
  initial,
  existingIds,
  onSave,
}) => {
  const isEdit = !!initial;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [id, setId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Initialise dialog state inside useEffect on `open` — prevents stale
  // overwrites (core memory rule).
  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setId(initial?.id ?? '');
    setThumbnail(initial?.thumbnail ?? '');
    setIdTouched(!!initial);
    setIsActive(initial?.isActive ?? false);
  }, [open, initial]);

  // Auto-slug id from title while user hasn't touched id manually.
  useEffect(() => {
    if (isEdit || idTouched) return;
    const base = slugify(title || 'story');
    const others = existingIds.filter((x) => x !== initial?.id);
    setId(uniqueId(base, others));
  }, [title, isEdit, idTouched, existingIds, initial?.id]);

  const canSave = title.trim().length > 0 && id.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit story' : 'Add story'}</DialogTitle>
          <DialogDescription>
            A story groups one or more steps. Markdown is supported in the description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-end gap-4">
            <div className="flex-1 min-w-0">
              <Label htmlFor="story-title">Title</Label>
              <Input
                id="story-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Austria Solar Potential"
              />
            </div>
            <div className="flex items-center gap-2 pb-2 shrink-0">
              <Label htmlFor="story-active" className="text-sm">Active</Label>
              <Switch
                id="story-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <div>
            <MarkdownEditor
              id="story-desc"
              value={description}
              onChange={setDescription}
              rows={4}
              placeholder="Explore **annual solar power potential** across Austria."
              toolbarLeft={<Label htmlFor="story-desc" className="text-sm">Description (markdown)</Label>}
            />
          </div>
          <div>
            <Label htmlFor="story-thumbnail">Thumbnail URL</Label>
            <Input
              id="story-thumbnail"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://.../story-thumbnail.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional image shown on the story card in the viewer's stories list.
            </p>
          </div>
          <div>
            <Label htmlFor="story-id">ID</Label>
            <Input
              id="story-id"
              value={id}
              onChange={(e) => {
                setIdTouched(true);
                setId(e.target.value);
              }}
              placeholder="austria-solar-intro"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-generated from the title; edit if you need a stable identifier.
            </p>
          </div>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              onSave({
                id: id.trim(),
                title: title.trim(),
                description: description || undefined,
                isActive,
                thumbnail: thumbnail.trim() || undefined,
              });
              onOpenChange(false);
            }}
          >
            {isEdit ? 'Save' : 'Add story'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoryFormDialog;
