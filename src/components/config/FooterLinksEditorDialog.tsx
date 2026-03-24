import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, ArrowDown, Mail, ExternalLink, Info } from 'lucide-react';
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
    // Split on '?' to get email and params
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

/** Convert a FooterLink into form state for editing */
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

const FooterLinksEditorDialog: React.FC<FooterLinksEditorDialogProps> = ({
  open,
  onOpenChange,
  footerLinks,
  onSave,
}) => {
  const [links, setLinks] = useState<LinkFormState[]>([]);

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open) {
      setLinks(
        footerLinks.length > 0
          ? footerLinks.map(linkToFormState)
          : []
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLink = () => {
    setLinks(prev => [...prev, createEmptyForm()]);
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof LinkFormState, value: string) => {
    setLinks(prev => prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
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

  const handleSave = () => {
    const footerLinksOut: FooterLink[] = links
      .filter(link => link.title.trim()) // Must have a title
      .map(link => {
        if (link.type === 'mailto') {
          return {
            title: link.title.trim(),
            url: buildMailtoUrl(link.email, link.cc, link.subject, link.body),
          };
        }
        return {
          title: link.title.trim(),
          url: link.url.trim(),
        };
      });
    onSave(footerLinksOut);
    onOpenChange(false);
  };

  const isLinkValid = (link: LinkFormState): boolean => {
    if (!link.title.trim()) return false;
    if (link.type === 'standard' && !link.url.trim()) return false;
    if (link.type === 'mailto' && !link.email.trim()) return false;
    return true;
  };

  const allValid = links.every(isLinkValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Footer Links</DialogTitle>
          <DialogDescription>
            Add links that appear in the application footer. Links are displayed in the order shown below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No footer links configured. Click the button below to add one.
            </p>
          )}

          {links.map((link, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              {/* Header row with reorder and delete */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Link {index + 1}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveLink(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveLink(index, 'down')}
                    disabled={index === links.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Link type selector */}
              <div className="flex items-center gap-3">
                <Label className="w-20 text-sm">Type</Label>
                <Select
                  value={link.type}
                  onValueChange={(value: 'standard' | 'mailto') => updateLink(index, 'type', value)}
                >
                  <SelectTrigger className="w-[180px]">
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

              {/* Title field (common) */}
              <div className="flex items-center gap-3">
                <Label className="w-20 text-sm">Label</Label>
                <Input
                  value={link.title}
                  onChange={(e) => updateLink(index, 'title', e.target.value)}
                  placeholder="Link display text"
                  className="flex-1"
                />
              </div>

              {/* Standard link fields */}
              {link.type === 'standard' && (
                <div className="flex items-center gap-3">
                  <Label className="w-20 text-sm">URL</Label>
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                </div>
              )}

              {/* Mailto fields */}
              {link.type === 'mailto' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm">Email *</Label>
                    <Input
                      value={link.email}
                      onChange={(e) => updateLink(index, 'email', e.target.value)}
                      placeholder="contact@example.com"
                      type="email"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm">CC</Label>
                    <Input
                      value={link.cc}
                      onChange={(e) => updateLink(index, 'cc', e.target.value)}
                      placeholder="cc@example.com"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm">Draft subject</Label>
                    <Input
                      value={link.subject}
                      onChange={(e) => updateLink(index, 'subject', e.target.value)}
                      placeholder="Pre-filled email subject"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20 text-sm">Draft body</Label>
                    <Input
                      value={link.body}
                      onChange={(e) => updateLink(index, 'body', e.target.value)}
                      placeholder="Pre-filled email body text"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-start gap-2 ml-[calc(5rem+0.75rem)] text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Subject and body text will be pre-populated in the user's email client when they click this link.</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addLink} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Footer Link
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={links.length > 0 && !allValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FooterLinksEditorDialog;
