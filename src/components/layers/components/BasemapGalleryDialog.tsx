import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Key, Loader2, Map as MapIcon } from 'lucide-react';
import { DataSource } from '@/types/config';
import {
  BASEMAP_CATEGORIES, BASEMAP_COVERAGES, BasemapCategory, BasemapCoverage, coversPoint, entryPreviewCenter, GalleryEntry, fetchXyzProviders, previewTileUrl, resolveTemplate, toBaseLayer,
} from '@/utils/basemapGallery/xyzServices';

interface Props {
  open: boolean;
  onClose: () => void;
  /** [lng, lat] */
  center: [number, number];
  existingUrls: string[];
  onConfirm: (layers: DataSource[]) => void;
}

const BasemapGalleryDialog: React.FC<Props> = ({ open, onClose, center, existingUrls, onConfirm }) => {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<BasemapCategory | 'All'>('All');
  const [showKeyed, setShowKeyed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [highlight, setHighlight] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<BasemapCoverage | 'All'>('All');
  const [onCentre, setOnCentre] = useState(false);
  const [activeOnLoad, setActiveOnLoad] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSelected([]); setKeys({}); setHighlight(null); setSearch(''); setActiveOnLoad(false);
    let cancelled = false;
    setLoading(true); setError(null);
    fetchXyzProviders()
      .then((e) => { if (!cancelled) setEntries(e); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, reloadToken]);

  const existing = useMemo(() => new Set(existingUrls), [existingUrls]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) =>
      (showKeyed || !e.requiresKey) &&
      (category === 'All' || e.category === category) &&
      (coverage === 'All' || e.coverage === coverage) &&
      (!onCentre || coversPoint(e, center) === true) &&
      (!q || e.name.toLowerCase().includes(q) || e.provider.toLowerCase().includes(q)),
    );
  }, [entries, search, category, showKeyed, coverage, onCentre, center]);

  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const highlighted = highlight ? byId.get(highlight) : undefined;
  const highlightUrl = highlighted ? resolveTemplate(highlighted, keys[highlighted.id]) : undefined;
  const highlightCenter = highlighted ? entryPreviewCenter(highlighted, center) : center;
  const highlightNeedsKey = !!highlighted?.requiresKey && !keys[highlighted.id]?.trim();

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setHighlight(id);
  };

  const missingKeys = selected.filter((id) => byId.get(id)?.requiresKey && !keys[id]?.trim());
  const anyKeyed = selected.some((id) => byId.get(id)?.keyField && keys[id]?.trim());

  const handleConfirm = () => {
    const layers = selected
      .map((id, i) => {
        const e = byId.get(id);
        return e ? toBaseLayer(e, { key: keys[id], center, isActive: activeOnLoad && i === 0 }) : null;
      })
      .filter(Boolean) as DataSource[];
    onConfirm(layers);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MapIcon className="h-4 w-4" />Basemap Gallery</DialogTitle>
          <DialogDescription>
            Ready-made background maps from the open xyzservices registry. Provider terms of use still apply.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or provider…" className="max-w-xs" />
          <div className="flex items-center gap-2">
            <Switch id="bg-keyed" checked={showKeyed} onCheckedChange={setShowKeyed} />
            <Label htmlFor="bg-keyed" className="text-sm">Show maps that need an API key</Label>
          </div>
        </div>
        <Tabs value={category} onValueChange={(v) => setCategory(v as BasemapCategory | 'All')}>
          <TabsList className="flex-wrap h-auto">
            {(['All', ...BASEMAP_CATEGORIES] as const).map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Coverage</span>
          <Tabs value={coverage} onValueChange={(v) => setCoverage(v as BasemapCoverage | 'All')}>
            <TabsList>
              {(['All', ...BASEMAP_COVERAGES] as const).map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Switch id="bg-centre" checked={onCentre} onCheckedChange={setOnCentre} />
            <Label htmlFor="bg-centre" className="text-sm">Covers map centre</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 min-h-0 flex-1">
          <ScrollArea className="h-[48vh] border rounded-md">
            {loading && <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading basemaps…</div>}
            {error && (
              <div className="p-6 space-y-2 text-sm">
                <p className="text-destructive">{error}</p>
                <Button size="sm" variant="outline" onClick={() => setReloadToken((t) => t + 1)}>Retry</Button>
              </div>
            )}
            {!loading && !error && visible.length === 0 && <p className="p-6 text-sm text-muted-foreground">No basemaps match.</p>}
            <div className="divide-y">
              {!loading && !error && visible.map((e) => {
                const tpl = resolveTemplate(e, keys[e.id]);
                const added = existing.has(tpl);
                const isSel = selected.includes(e.id);
                const covers = coversPoint(e, center);
                return (
                  <div key={e.id}
                    className={`flex items-center gap-3 p-2 cursor-pointer ${highlight === e.id ? 'bg-muted' : 'hover:bg-muted/50'} ${added ? 'opacity-50' : ''}`}
                    onClick={() => setHighlight(e.id)}>
                    <Checkbox checked={isSel} disabled={added} onCheckedChange={() => toggle(e.id)} onClick={(ev) => ev.stopPropagation()} />
                    <div className="h-12 w-12 shrink-0 rounded border bg-muted overflow-hidden">
                      {!(e.requiresKey && !keys[e.id]) && (
                        <img src={previewTileUrl(tpl, entryPreviewCenter(e, center), Math.min(Math.max(e.minZoom ?? 0, 4), e.maxZoom ?? 20))} alt="" loading="lazy" className="h-full w-full object-cover"
                          onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.provider} · {e.category}{covers === false && ' · Outside map centre'}</p>
                    </div>
                    {(e.minZoom !== undefined || e.maxZoom !== undefined) && (
                      <Badge variant="outline" className="text-[10px]">z{e.minZoom ?? 0}–{e.maxZoom ?? '…'}</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">{e.isPolar ? 'Polar' : e.country ? `National · ${e.country}` : e.coverage}</Badge>
                    {e.requiresKey && <Badge variant="secondary" className="text-[10px]"><Key className="h-3 w-3 mr-1" />Key</Badge>}
                    {added && <Badge variant="outline" className="text-[10px]">Added</Badge>}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="space-y-2 min-w-0">
            {highlighted ? (
              <>
                <p className="text-sm font-medium">{highlighted.name}</p>
                <div className="h-56 rounded-md overflow-hidden border">
                  {highlightUrl && !highlightNeedsKey ? (
                    <MapContainer key={highlightUrl} center={[highlightCenter[1], highlightCenter[0]]} zoom={Math.max(highlighted.minZoom ?? 0, 4)}
                      minZoom={highlighted.minZoom ?? 0} maxZoom={highlighted.maxZoom ?? 19} className="h-full w-full" attributionControl={false}>
                      <TileLayer url={highlightUrl} />
                    </MapContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">Enter an API key to preview this basemap</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground break-words">{highlighted.attributionText}</p>
                {highlighted.keyField && (
                  <div className="space-y-1">
                    <Label className="text-xs">API key {highlighted.requiresKey ? '(required)' : '(optional)'}</Label>
                    <Input value={keys[highlighted.id] || ''} onChange={(ev) => setKeys((k) => ({ ...k, [highlighted.id]: ev.target.value }))} placeholder="Paste key" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a basemap to preview it.</p>
            )}
          </div>
        </div>

        {anyKeyed && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />API keys are written into the tile address and will be visible in the saved configuration.
          </p>
        )}
        {missingKeys.length > 0 && (
          <p className="text-xs text-destructive">{missingKeys.length} selected basemap{missingKeys.length > 1 ? 's need' : ' needs'} an API key.</p>
        )}

        <DialogFooter className="items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <div className="flex items-center gap-2">
              <Checkbox id="bg-active" checked={activeOnLoad} onCheckedChange={(v) => setActiveOnLoad(!!v)} />
              <Label htmlFor="bg-active" className="text-sm">Display first selection on load</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={selected.length === 0 || missingKeys.length > 0}>
              Add {selected.length || ''} base map{selected.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BasemapGalleryDialog;
