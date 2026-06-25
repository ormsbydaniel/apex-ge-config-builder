
import React, { useState, useEffect } from 'react';
import { Pencil, FileText, ArrowLeft, Download, Loader2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { loadCatalogue, resolveProviderUrl } from '@/lib/catalogue/apexCatalogue';
import type { CatalogueEntry } from '@/lib/catalogue/types';

interface LayerDescriptionAttributionDisplayProps {
  source: DataSource;
  onUpdateMeta: (updates: Record<string, any>) => void;
  /** When provided, enables an "Update from catalogue" action that pulls values
   *  from the matching APEx Algorithm Catalogue record. */
  catalogueLookup?: { serviceId: string; serviceProvider: string };
}

type ViewMode = 'main' | 'help' | 'catalogue';

const LayerDescriptionAttributionDisplay = ({ source, onUpdateMeta, catalogueLookup }: LayerDescriptionAttributionDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('main');
  const [description, setDescription] = useState('');
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');


  // Catalogue sub-view state
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catEntry, setCatEntry] = useState<CatalogueEntry | null>(null);
  const [catDescription, setCatDescription] = useState<string>('');
  const [catAttrText, setCatAttrText] = useState<string>('');
  const [catAttrUrl, setCatAttrUrl] = useState<string>('');
  const [pickDescription, setPickDescription] = useState(true);
  const [pickAttrText, setPickAttrText] = useState(true);
  const [pickAttrUrl, setPickAttrUrl] = useState(true);

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

  // Fetch catalogue match when entering the catalogue sub-view
  useEffect(() => {
    if (view !== 'catalogue' || !catalogueLookup) return;
    let cancelled = false;
    setCatLoading(true);
    setCatError(null);
    setCatEntry(null);
    setCatDescription('');
    setCatAttrText('');
    setCatAttrUrl('');
    (async () => {
      try {
        const entries = await loadCatalogue();
        if (cancelled) return;
        const match = entries.find(
          (e) =>
            e.provider === catalogueLookup.serviceProvider &&
            (e.record?.id === catalogueLookup.serviceId || e.algorithmId === catalogueLookup.serviceId),
        );
        if (!match) {
          setCatLoading(false);
          return;
        }
        setCatEntry(match);
        setCatDescription(match.record?.properties?.description?.trim() || match.description || '');
        setCatAttrText(match.provider || '');
        const url = await resolveProviderUrl(match);
        if (cancelled) return;
        setCatAttrUrl(url || '');
        setCatLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setCatError(e?.message || 'Failed to load catalogue');
        setCatLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, catalogueLookup?.serviceId, catalogueLookup?.serviceProvider]);

  const applyFromCatalogue = () => {
    if (pickDescription && catDescription) setDescription(catDescription);
    if (pickAttrText && catAttrText) setAttributionText(catAttrText);
    if (pickAttrUrl && catAttrUrl) setAttributionUrl(catAttrUrl);
    setView('main');
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

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setView('main'); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          {view === 'help' ? (
            <>
              <DialogHeader>
                <DialogTitle>Markdown Reference</DialogTitle>
              </DialogHeader>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 underline cursor-pointer"
                onClick={() => setView('main')}
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <div className="flex-1 overflow-y-auto pr-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {"\n"}
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
          ) : view === 'catalogue' ? (
            <>
              <DialogHeader>
                <DialogTitle>Update from catalogue</DialogTitle>
              </DialogHeader>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 underline cursor-pointer"
                onClick={() => setView('main')}
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Pull values from the matching APEx catalogue record.
                  </p>
                  {catLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Looking up catalogue…
                    </div>
                  ) : catError ? (
                    <p className="text-sm text-destructive">{catError}</p>
                  ) : !catEntry ? (
                    <p className="text-sm text-muted-foreground">No matching record found in the APEx catalogue.</p>
                  ) : (
                    <div className="space-y-3">
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={pickDescription}
                          onCheckedChange={(v) => setPickDescription(!!v)}
                          disabled={!catDescription}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium">Description</span>
                          {!catDescription && <span className="text-muted-foreground"> (not available)</span>}
                          {catDescription && (
                            <span className="block text-xs text-muted-foreground line-clamp-3">{catDescription}</span>
                          )}
                        </span>
                      </label>
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={pickAttrText}
                          onCheckedChange={(v) => setPickAttrText(!!v)}
                          disabled={!catAttrText}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium">Attribution text</span>
                          {!catAttrText
                            ? <span className="text-muted-foreground"> (not available)</span>
                            : <span className="block text-xs text-muted-foreground">{catAttrText}</span>}
                        </span>
                      </label>
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={pickAttrUrl}
                          onCheckedChange={(v) => setPickAttrUrl(!!v)}
                          disabled={!catAttrUrl}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium">Attribution URL</span>
                          {!catAttrUrl
                            ? <span className="text-muted-foreground"> (not available)</span>
                            : <span className="block text-xs text-muted-foreground break-all">{catAttrUrl}</span>}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setView('main')}>Cancel</Button>
                <Button
                  onClick={applyFromCatalogue}
                  disabled={
                    catLoading || !catEntry ||
                    !((pickDescription && catDescription) || (pickAttrText && catAttrText) || (pickAttrUrl && catAttrUrl))
                  }
                >
                  Apply
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Description &amp; Attribution</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4 py-2">
                  {catalogueLookup && (
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setView('catalogue')}
                        className="h-8"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Update from catalogue
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="layer-description">Description</Label>
                    <p className="text-xs text-muted-foreground">
                      Description supports basic markdown from GE v3.7 onwards.{' '}
                      <button
                        type="button"
                        className="text-primary hover:text-primary/80 underline cursor-pointer"
                        onClick={() => setView('help')}
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
