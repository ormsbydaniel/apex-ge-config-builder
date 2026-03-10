
import React, { useState } from 'react';
import { Pencil, FileText } from 'lucide-react';
import { DataSource } from '@/types/config';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface LayerDescriptionAttributionDisplayProps {
  source: DataSource;
  onUpdateMeta: (updates: Record<string, any>) => void;
}

const LayerDescriptionAttributionDisplay = ({ source, onUpdateMeta }: LayerDescriptionAttributionDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');

  const hasDescription = !!source.meta?.description;
  const hasAttribution = !!source.meta?.attribution?.text;
  const hasContent = hasDescription || hasAttribution;

  const handleOpen = () => {
    setDescription(source.meta?.description || '');
    setAttributionText(source.meta?.attribution?.text || '');
    setAttributionUrl(source.meta?.attribution?.url || '');
    setIsOpen(true);
  };

  const handleSave = () => {
    onUpdateMeta({
      description,
      attribution: {
        text: attributionText,
        url: attributionUrl || undefined,
      },
    });
    setIsOpen(false);
  };

  return (
    <>
      <div className="space-y-2 -mt-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Description &amp; Attribution</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleOpen}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        {hasContent ? (
          <div className="text-xs text-muted-foreground space-y-1 ml-6">
            {hasDescription && (
              <p>{source.meta!.description}</p>
            )}
            {hasAttribution && (
              <div>
                <span className="font-medium">Attribution:</span> {source.meta!.attribution.text}
                {source.meta!.attribution.url && (
                  <span className="ml-1">
                    (<a
                      href={source.meta!.attribution.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline"
                    >
                      link
                    </a>)
                  </span>
                )}
                    >
                      link
                    </a>)
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground ml-6">No description or attribution configured</p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Description &amp; Attribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="layer-description">Description</Label>
              <Textarea
                id="layer-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Layer description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="layer-attribution-text">Attribution Text</Label>
              <Input
                id="layer-attribution-text"
                value={attributionText}
                onChange={(e) => setAttributionText(e.target.value)}
                placeholder="Data provider name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="layer-attribution-url">Attribution URL</Label>
              <Input
                id="layer-attribution-url"
                value={attributionUrl}
                onChange={(e) => setAttributionUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LayerDescriptionAttributionDisplay;
