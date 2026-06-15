import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, AlertCircle } from 'lucide-react';
import { loadCatalogue, mapRecordToWorkflowFields, getCachedEntries, OPENEO_UDP_URI, OGC_PROCESSES_URI } from '@/lib/catalogue/apexCatalogue';
import type { CatalogueEntry, MappedWorkflowFields } from '@/lib/catalogue/types';

interface CatalogueBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fields: MappedWorkflowFields, entry: CatalogueEntry) => void;
  /** Optional: invoked when the user wants to bypass the catalogue and create a blank workflow. */
  onSkip?: () => void;
}

function getAlgorithmType(entry: CatalogueEntry): string {
  const ct = entry.record.conformsTo ?? [];
  if (ct.includes(OGC_PROCESSES_URI)) return 'OGC Processes';
  if (ct.includes(OPENEO_UDP_URI)) return 'openEO UDP';
  return 'Unknown';
}

type SortKey = 'name' | 'provider' | 'type' | 'description';

export const CatalogueBrowserDialog = ({ open, onOpenChange, onSelect, onSkip }: CatalogueBrowserDialogProps) => {
  const [entries, setEntries] = useState<CatalogueEntry[]>(() => getCachedEntries() ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!open) return;
    setSelectedPath(null);
    setQuery('');
    const cached = getCachedEntries();
    if (cached && cached.length > 0) {
      setEntries(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadCatalogue()
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load catalogue');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  const retry = () => {
    setLoading(true);
    setError(null);
    loadCatalogue()
      .then((data) => setEntries(data))
      .catch((e) => setError(e?.message ?? 'Failed to load catalogue'))
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = entries;
    if (q) {
      rows = rows.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        getAlgorithmType(e).toLowerCase().includes(q)
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const getValue = (e: CatalogueEntry) =>
        sortKey === 'type' ? getAlgorithmType(e) : (e[sortKey] ?? '');
      const av = getValue(a).toString().toLowerCase();
      const bv = getValue(b).toString().toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [entries, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const selectedEntry = filtered.find((e) => e.path === selectedPath) ?? entries.find((e) => e.path === selectedPath) ?? null;

  const confirm = () => {
    if (!selectedEntry) return;
    onSelect(mapRecordToWorkflowFields(selectedEntry), selectedEntry);
    onOpenChange(false);
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>APEx Algorithm Catalogue</DialogTitle>
          <DialogDescription>
            Browsing <code className="text-xs">ESA-APEx/apex_algorithms</code> @ <code className="text-xs">main</code>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b shrink-0">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, provider, or description…"
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-3">
          {error && (
            <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex-1">{error}</div>
              <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
            </div>
          )}

          {!error && loading && entries.length === 0 && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          )}

          {!error && !loading && filtered.length === 0 && entries.length > 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center">No algorithms match.</div>
          )}

          {!error && entries.length > 0 && (
            <TooltipProvider delayDuration={400}>
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[96px]"></TableHead>
                    <TableHead className="cursor-pointer select-none w-[24%]" onClick={() => toggleSort('name')}>
                      Name{sortIndicator('name')}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none w-[16%]" onClick={() => toggleSort('provider')}>
                      Provider{sortIndicator('provider')}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none w-[12%]" onClick={() => toggleSort('type')}>
                      Type{sortIndicator('type')}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('description')}>
                      Description{sortIndicator('description')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => {
                    const isSelected = entry.path === selectedPath;
                    return (
                      <TableRow
                        key={entry.path}
                        data-state={isSelected ? 'selected' : undefined}
                        className="cursor-pointer"
                        onClick={() => setSelectedPath(entry.path)}
                        onDoubleClick={() => {
                          setSelectedPath(entry.path);
                          onSelect(mapRecordToWorkflowFields(entry), entry);
                          onOpenChange(false);
                        }}
                      >
                        <TableCell>
                          {entry.thumbnail ? (
                            <img
                              src={entry.thumbnail}
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 rounded object-cover bg-muted"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium break-words">{entry.name}</TableCell>
                        <TableCell className="text-muted-foreground break-words">{entry.provider}</TableCell>
                        <TableCell className="text-muted-foreground">{getAlgorithmType(entry)}</TableCell>
                        <TableCell className="text-muted-foreground min-w-0">
                          {entry.description ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="line-clamp-2 break-words block">{entry.description}</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <p className="text-xs whitespace-pre-wrap">{entry.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="italic opacity-60">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t shrink-0 sm:justify-between">
          <div className="text-xs text-muted-foreground self-center">
            {entries.length > 0 && (
              <>
                {filtered.length} of {entries.length} algorithm{entries.length === 1 ? '' : 's'}
                {selectedEntry && <> · Selected: <span className="font-medium text-foreground">{selectedEntry.name}</span></>}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>Skip — create blank</Button>
            )}
            <Button onClick={confirm} disabled={!selectedEntry}>Use selected algorithm</Button>
          </div>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogueBrowserDialog;
