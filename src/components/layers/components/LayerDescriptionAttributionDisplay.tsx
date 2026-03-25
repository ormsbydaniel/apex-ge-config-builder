
import React, { useState } from 'react';
import { Pencil, FileText, ArrowLeft } from 'lucide-react';
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface LayerDescriptionAttributionDisplayProps {
  source: DataSource;
  onUpdateMeta: (updates: Record<string, any>) => void;
}

const LayerDescriptionAttributionDisplay = ({ source, onUpdateMeta }: LayerDescriptionAttributionDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
      <div className="space-y-2 -mt-2">
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
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground ml-6">No description or attribution configured</p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setShowHelp(false); }}>
        <DialogContent className="sm:max-w-[700px] h-[540px] flex flex-col">
          {showHelp ? (
            <>
              <DialogHeader>
                <DialogTitle>Markdown Reference</DialogTitle>
              </DialogHeader>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 underline cursor-pointer"
                onClick={() => setShowHelp(false)}
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <div className="flex-1 overflow-y-auto pr-2">
                <p className="text-sm text-muted-foreground mb-4">
                  The description field supports the following markdown:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Syntax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Hyperlink</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">[text](https://url/)</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Italics</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">*text*</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bold</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">**text**</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Heading 1</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded"># text</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Heading 2</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">## text</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">List</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">- item 1</code>
                        <br />
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">- item 2</code>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Quote</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">&gt; text</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Code</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">`code`</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Description &amp; Attribution</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="layer-description">Description</Label>
                    <p className="text-xs text-muted-foreground">
                      Description supports basic markdown.{' '}
                      <button
                        type="button"
                        className="text-primary hover:text-primary/80 underline cursor-pointer"
                        onClick={() => setShowHelp(true)}
                      >
                        Tell me more
                      </button>
                    </p>
                    <Textarea
                      id="layer-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Layer description..."
                      rows={8}
                      className="min-h-[180px]"
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LayerDescriptionAttributionDisplay;
