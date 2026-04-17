import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, ArrowDown, Mail, ExternalLink, Info, Pencil } from 'lucide-react';
import { FooterLink } from '@/types/format';

interface FooterLinksEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  footerLinks: FooterLink[];
  onSave: (links: FooterLink[]) => void;
}

interface LinkFormState {
  type: 'standard' | 'mailto';
  title: string;
  url: string;
  email: string;
  cc: string;
  subject: string;
  body: string;
}

const createEmptyForm = (): LinkFormState => ({
  type: 'standard',
  title: '',
  url: '',
  email: '',
  cc: '',
  subject: '',
  body: '',
});

/** Parse a mailto: URL into its component parts */
const parseMailtoUrl = (url: string): { email: string; cc: string; subject: string; body: string } => {
  const result = { email: '', cc: '', subject: '', body: '' };
  if (!url.startsWith('mailto:')) return result;

  try {
    const withoutScheme = url.slice(7);
    const qIndex = withoutScheme.indexOf('?');
    if (qIndex === -1) {
      result.email = decodeURIComponent(withoutScheme);
    } else {
      result.email = decodeURIComponent(withoutScheme.slice(0, qIndex));
      const params = new URLSearchParams(withoutScheme.slice(qIndex + 1));
      result.cc = params.get('cc') || '';
      result.subject = params.get('subject') || '';
      result.body = params.get('body') || '';
    }
  } catch {
    // If parsing fails, just return what we have
  }
  return result;
};

/** Build a mailto: URL from component parts */
const buildMailtoUrl = (email: string, cc: string, subject: string, body: string): string => {
  const params = new URLSearchParams();
  if (cc.trim()) params.set('cc', cc.trim());
  if (subject.trim()) params.set('subject', subject.trim());
  if (body.trim()) params.set('body', body.trim());
  const paramString = params.toString();
  return `mailto:${encodeURIComponent(email.trim())}${paramString ? '?' + paramString : ''}`;
};

/** Convert a FooterLink into form state */
const linkToFormState = (link: FooterLink): LinkFormState => {
  if (link.url.startsWith('mailto:')) {
    const parsed = parseMailtoUrl(link.url);
    return {
      type: 'mailto',
      title: link.title,
      url: '',
      ...parsed,
    };
  }
  return {
    type: 'standard',
    title: link.title,
    url: link.url,
    email: '',
    cc: '',
    subject: '',
    body: '',
  };
};

/** Convert a LinkFormState to a FooterLink */
const formStateToLink = (form: LinkFormState): FooterLink => {
  if (form.type === 'mailto') {
    return {
      title: form.title.trim(),
      url: buildMailtoUrl(form.email, form.cc, form.subject, form.body),
    };
  }
  return {
    title: form.title.trim(),
    url: form.url.trim(),
  };
};

/** Get a display URL for a link form state */
const getDisplayUrl = (link: LinkFormState): string => {
  if (link.type === 'mailto') {
    return link.email || 'No email set';
  }
  return link.url || 'No URL set';
};

const isFormValid = (form: LinkFormState): boolean => {
  if (!form.title.trim()) return false;
  if (form.type === 'standard' && !form.url.trim()) return false;
  if (form.type === 'mailto' && !form.email.trim()) return false;
  return true;
};

const FooterLinksEditorDialog: React.FC<FooterLinksEditorDialogProps> = ({
  open,
  onOpenChange,
  footerLinks,
  onSave,
}) => {
  const [links, setLinks] = useState<LinkFormState[]>([]);
  const [page, setPage] = useState<'list' | 'edit'>('list');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<LinkFormState>(createEmptyForm());

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open) {
      setLinks(footerLinks.length > 0 ? footerLinks.map(linkToFormState) : []);
      setPage('list');
      setEditingIndex(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;
    setLinks(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleAddNew = () => {
    setEditForm(createEmptyForm());
    setEditingIndex(null);
    setPage('edit');
  };

  const handleEditLink = (index: number) => {
    setEditForm({ ...links[index] });
    setEditingIndex(index);
    setPage('edit');
  };

  const handleEditFormChange = (field: keyof LinkFormState, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      // Update existing
      setLinks(prev => prev.map((link, i) => (i === editingIndex ? { ...editForm } : link)));
    } else {
      // Add new
      setLinks(prev => [...prev, { ...editForm }]);
    }
    setPage('list');
  };

  const handleCancelEdit = () => {
    setPage('list');
  };

  const handleDone = () => {
    const footerLinksOut: FooterLink[] = links
      .filter(link => link.title.trim())
      .map(formStateToLink);
    onSave(footerLinksOut);
    onOpenChange(false);
  };

  // ---- Page 1: List View ----
  const renderListPage = () => (
    <>
      <DialogHeader>
        <DialogTitle>Footer Links</DialogTitle>
        <DialogDescription>
          Manage links displayed in the application footer. Links appear in the order shown below.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-4">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No footer links configured. Click the button below to add one.
          </p>
        ) : (
          links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border rounded-lg px-3 py-2.5 bg-muted/30"
            >
              {/* Icon */}
              {link.type === 'mailto' ? (
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              {/* Title and URL */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{link.title || 'Untitled'}</div>
                <div className="text-xs text-muted-foreground truncate">{getDisplayUrl(link)}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEditLink(index)}
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveLink(index, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveLink(index, 'down')}
                  disabled={index === links.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeLink(index)}
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}

        <Button variant="outline" onClick={handleAddNew} className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Footer Link
        </Button>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleDone}>
          Done
        </Button>
      </DialogFooter>
    </>
  );

  // ---- Page 2: Edit/Add Form ----
  const renderEditPage = () => (
    <>
      <DialogHeader>
        <DialogTitle>{editingIndex !== null ? 'Edit Footer Link' : 'Add Footer Link'}</DialogTitle>
        <DialogDescription>
          {editingIndex !== null
            ? 'Update the details for this footer link.'
            : 'Configure the details for the new footer link.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Link type selector */}
        <div className="flex items-center gap-3">
          <Label className="w-24 text-sm shrink-0">Type</Label>
          <Select
            value={editForm.type}
            onValueChange={(value: 'standard' | 'mailto') =>
              handleEditFormChange('type', value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Standard Link
                </span>
              </SelectItem>
              <SelectItem value="mailto">
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Email (mailto)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Label */}
        <div className="flex items-center gap-3">
          <Label className="w-24 text-sm shrink-0">Footer label *</Label>
          <Input
            value={editForm.title}
            onChange={(e) => handleEditFormChange('title', e.target.value)}
            placeholder="Link display text"
            className="flex-1"
          />
        </div>

        {/* Standard link fields */}
        {editForm.type === 'standard' && (
          <div className="flex items-center gap-3">
            <Label className="w-24 text-sm shrink-0">URL *</Label>
            <Input
              value={editForm.url}
              onChange={(e) => handleEditFormChange('url', e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
          </div>
        )}

        {/* Mailto fields */}
        {editForm.type === 'mailto' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="w-24 text-sm shrink-0">Email *</Label>
              <Input
                value={editForm.email}
                onChange={(e) => handleEditFormChange('email', e.target.value)}
                placeholder="contact@example.com"
                type="email"
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-24 text-sm shrink-0">CC</Label>
              <Input
                value={editForm.cc}
                onChange={(e) => handleEditFormChange('cc', e.target.value)}
                placeholder="cc@example.com"
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-24 text-sm shrink-0">Draft subject</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => handleEditFormChange('subject', e.target.value)}
                placeholder="Pre-filled email subject"
                className="flex-1"
              />
            </div>
            <div className="flex items-start gap-3">
              <Label className="w-24 text-sm shrink-0 mt-2">Draft body</Label>
              <textarea
                value={editForm.body}
                onChange={(e) => handleEditFormChange('body', e.target.value)}
                placeholder="Pre-filled email body text"
                rows={3}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex items-start gap-2 ml-[calc(6rem+0.75rem)] text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Subject and body text will be pre-populated in the user's email client when they click this link.</span>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleCancelEdit}>
          Cancel
        </Button>
        <Button onClick={handleSaveEdit} disabled={!isFormValid(editForm)}>
          {editingIndex !== null ? 'Update' : 'Add'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {page === 'list' ? renderListPage() : renderEditPage()}
      </DialogContent>
    </Dialog>
  );
};

export default FooterLinksEditorDialog;
