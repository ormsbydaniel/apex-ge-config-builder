import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { DataSourceItem } from '@/types/config';
import { getEffectiveFormat, resolveDataSourceInspectionAccess } from '@/utils/stacAssetFormat';
import { fetchStacCollection, fetchStacItemSample, getStacCollectionUrl, stripUrlParams, type StacItemSample } from '@/utils/stacMetadata';
import CogMetadataDialog from './CogMetadataDialog';
import FlatGeobufMetadataDialog from './FlatGeobufMetadataDialog';

type Tab = 'collection' | 'item' | 'asset';
interface LoadState<T> { loading: boolean; error?: string; data?: T }

interface Props {
  dataSource: Pick<DataSourceItem, 'url' | 'format' | 'assets' | 'assetFormats'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value === undefined || value === null || value === '' ? null : (
    <div className="grid grid-cols-[9rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  );

const RawJson = ({ data }: { data: unknown }) => (
  <details className="mt-3">
    <summary className="cursor-pointer text-xs text-muted-foreground">Raw JSON</summary>
    <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(data, null, 2)}</pre>
  </details>
);

const Status = ({ state, empty }: { state: LoadState<unknown>; empty: string }) => {
  if (state.loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (!state.data) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return null;
};

const StacMetadataDialog = ({ dataSource, open, onOpenChange }: Props) => {
  const url = dataSource.url || '';
  const assetName = dataSource.assets?.[0];
  const assetFormat = getEffectiveFormat(dataSource);
  const hasMappedAsset = !!assetName && assetFormat !== 'stac';

  const [tab, setTab] = useState<Tab>('item');
  const [collection, setCollection] = useState<LoadState<any>>({ loading: false });
  const [item, setItem] = useState<LoadState<StacItemSample>>({ loading: false });
  const [assetUrl, setAssetUrl] = useState<LoadState<string>>({ loading: false });
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const loaded = useRef<Set<Tab>>(new Set());
  const generation = useRef(0);

  useEffect(() => {
    if (!open) return;
    generation.current += 1;
    loaded.current = new Set();
    setCollection({ loading: false });
    setItem({ loading: false });
    setAssetUrl({ loading: false });
    setTab(hasMappedAsset ? 'asset' : 'item');
  }, [open, url, hasMappedAsset]);

  useEffect(() => {
    if (!open || loaded.current.has(tab)) return;
    loaded.current.add(tab);
    const gen = generation.current;
    const guard = (fn: () => void) => { if (gen === generation.current) fn(); };
    const msg = (e: unknown) => (e instanceof Error ? e.message : 'Failed to load');

    // Item data is needed by both the item and asset tabs.
    const loadItem = () => {
      if (loaded.current.has('item') && tab !== 'item') return;
      loaded.current.add('item');
      setItem({ loading: true });
      fetchStacItemSample(url)
        .then((data) => guard(() => setItem({ loading: false, data })))
        .catch((e) => guard(() => setItem({ loading: false, error: msg(e) })));
    };

    if (tab === 'collection') {
      if (!getStacCollectionUrl(url)) { setCollection({ loading: false }); return; }
      setCollection({ loading: true });
      fetchStacCollection(url)
        .then((data) => guard(() => setCollection({ loading: false, data })))
        .catch((e) => guard(() => setCollection({ loading: false, error: msg(e) })));
    } else if (tab === 'item') {
      loadItem();
    } else {
      loadItem();
      if (!hasMappedAsset) return;
      setAssetUrl({ loading: true });
      resolveDataSourceInspectionAccess(dataSource)
        .then((access) => guard(() => setAssetUrl(access ? { loading: false, data: access.url } : { loading: false, error: 'The asset could not be found on the first item.' })))
        .catch((e) => guard(() => setAssetUrl({ loading: false, error: msg(e) })));
    }
  }, [open, tab, url, hasMappedAsset, dataSource]);

  const c = collection.data;
  const it = item.data?.item;
  const assetEntry = assetName ? it?.assets?.[assetName] : undefined;
  const bands = assetEntry?.['eo:bands'] ?? assetEntry?.['raster:bands'];
  const inspectable = assetFormat === 'cog' || assetFormat === 'flatgeobuf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>STAC Metadata</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="item">Item</TabsTrigger>
            <TabsTrigger value="asset">Asset</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-1 h-full min-h-0 overflow-y-auto">
            {!getStacCollectionUrl(url) ? (
              <p className="text-sm text-muted-foreground">Collection metadata is not available for this address.</p>
            ) : (
              <>
                <Status state={collection} empty="No collection metadata." />
                {c && (
                  <>
                    <Row label="Title" value={c.title || c.id} />
                    <Row label="Description" value={c.description} />
                    <Row label="Licence" value={c.license} />
                    <Row label="Providers" value={c.providers?.map((p: any) => p.name).join(', ')} />
                    <Row label="Spatial extent" value={c.extent?.spatial?.bbox?.[0]?.join(', ')} />
                    <Row label="Temporal extent" value={c.extent?.temporal?.interval?.[0]?.map((d: string | null) => d ?? 'open').join(' → ')} />
                    <Row label="Keywords" value={c.keywords?.join(', ')} />
                    <Row label="Item assets" value={c.item_assets ? Object.keys(c.item_assets).join(', ') : undefined} />
                    <Row label="Queryables" value={c.links?.some((l: any) => l.rel?.includes('queryables')) ? 'Available' : undefined} />
                    <RawJson data={c} />
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="item" className="space-y-1 h-full min-h-0 overflow-y-auto">
            <Status state={item} empty="No items were returned." />
            {item.data && !item.data.single && it && (
              <p className="mb-2 text-xs text-muted-foreground">
                Showing the first of {item.data.returned ?? '?'} returned{item.data.matched !== undefined ? ` (${item.data.matched} matched)` : ''}.
              </p>
            )}
            {it && (
              <>
                <Row label="ID" value={it.id} />
                <Row label="Datetime" value={it.properties?.datetime ?? [it.properties?.start_datetime, it.properties?.end_datetime].filter(Boolean).join(' → ')} />
                <Row label="Bbox" value={it.bbox?.join(', ')} />
                <Row label="Geometry" value={it.geometry?.type} />
                <Row label="Platform" value={it.properties?.platform} />
                <Row label="Cloud cover" value={it.properties?.['eo:cloud_cover']} />
                <Row label="EPSG" value={it.properties?.['proj:epsg']} />
                <Row label="Assets" value={
                  <span className="flex flex-wrap gap-1">
                    {Object.keys(it.assets ?? {}).map((n) => (
                      <Badge key={n} variant={n === assetName ? 'default' : 'outline'} className="text-xs">{n}</Badge>
                    ))}
                  </span>
                } />
                <RawJson data={it} />
              </>
            )}
          </TabsContent>

          <TabsContent value="asset" className="space-y-1 h-full min-h-0 overflow-y-auto">
            {!hasMappedAsset ? (
              <p className="text-sm text-muted-foreground">No asset name and format are set. Edit the dataset to select an asset.</p>
            ) : (
              <>
                <Row label="Asset" value={`${assetName} (${assetFormat})`} />
                <Status state={item} empty="" />
                {assetEntry ? (
                  <>
                    <Row label="Title" value={assetEntry.title} />
                    <Row label="Location" value={assetEntry.href ? stripUrlParams(assetEntry.href) : undefined} />
                    <Row label="Type" value={assetEntry.type} />
                    <Row label="Roles" value={assetEntry.roles?.join(', ')} />
                    <Row label="Bands" value={Array.isArray(bands) ? bands.map((b: any, i: number) => b.name || b.common_name || `Band ${i + 1}`).join(', ') : undefined} />
                  </>
                ) : it && <p className="text-sm text-destructive">Asset "{assetName}" is not on the first item.</p>}
                <div className="pt-3">
                  {assetUrl.loading && <Status state={assetUrl} empty="" />}
                  {assetUrl.error && <p className="text-sm text-destructive">{assetUrl.error}</p>}
                  {assetUrl.data && inspectable && (
                    <Button size="sm" variant="outline" onClick={() => setInspectorOpen(true)}>
                      Inspect {assetFormat === 'cog' ? 'COG' : 'FlatGeobuf'} file
                    </Button>
                  )}
                  {assetUrl.data && !inspectable && (
                    <p className="text-xs text-muted-foreground">Detailed file inspection isn't available for {assetFormat} assets yet.</p>
                  )}
                </div>
                {assetEntry && <RawJson data={{ ...assetEntry, href: assetEntry.href ? stripUrlParams(assetEntry.href) : undefined }} />}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {assetUrl.data && assetFormat === 'cog' && (
        <CogMetadataDialog url={assetUrl.data} filename={assetName || 'asset'} isOpen={inspectorOpen} onClose={() => setInspectorOpen(false)} />
      )}
      {assetUrl.data && assetFormat === 'flatgeobuf' && (
        <FlatGeobufMetadataDialog url={assetUrl.data} open={inspectorOpen} onOpenChange={setInspectorOpen} />
      )}
    </Dialog>
  );
};

export default StacMetadataDialog;
