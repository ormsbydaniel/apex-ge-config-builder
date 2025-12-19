import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronDown, ChevronUp, Search, Folder, FileText, Download, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DataSourceFormat } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { AssetPreviewDialog, PreviewAsset } from './AssetPreviewDialog';
import {
  createStacBrowserUrl,
  detectAssetFormat,
  getItemsUrl,
  extractNextLink,
  getSelfLink,
  resolveAssetUrl,
  ensureSlash,
  type StacLink,
  type StacAsset,
  type StacCollection as StacCollectionType,
} from '@/utils/stacUtils';
import { rankCollection, filterAndRankCollections } from '@/utils/stacSearchUtils';

// Supported formats for direct connection (includes csv for chart data)
const SUPPORTED_FORMATS: (DataSourceFormat | string)[] = ['wms', 'wmts', 'xyz', 'wfs', 'cog', 'geojson', 'flatgeobuf', 'csv'];

// Use imported type with local interface extension for items
interface StacCollection extends StacCollectionType {}

interface StacItem {
  id: string;
  properties?: {
    title?: string;
    description?: string;
    datetime?: string;
  };
  assets?: Record<string, StacAsset>;
  links?: StacLink[];
}

export interface AssetSelection {
  url: string;
  format: DataSourceFormat | string;
  datetime?: string;
}

interface StacBrowserProps {
  serviceUrl: string;
  serviceName: string;
  onAssetSelect: (assets: AssetSelection | AssetSelection[]) => void;
}

type BrowserStep = 'collections' | 'items' | 'assets';

type DetectedMode = 'catalog' | 'itemCollection' | 'openEO-assets' | 'stac-item' | null;

const StacBrowser = ({ serviceUrl, serviceName, onAssetSelect }: StacBrowserProps) => {
  const [currentStep, setCurrentStep] = useState<BrowserStep>('collections');
  const [detectedMode, setDetectedMode] = useState<DetectedMode>(null);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverSearchTerm, setServerSearchTerm] = useState(''); // Track the search term used for server fetch (items only)
  const [showSupportedOnly, setShowSupportedOnly] = useState(false);
  const { toast } = useToast();

  // Collections state
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<StacCollection | null>(null);
  const [nextCollectionsUrl, setNextCollectionsUrl] = useState<string | null>(null);

  // Items state
  const [items, setItems] = useState<StacItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StacItem | null>(null);
  const [nextItemsUrl, setNextItemsUrl] = useState<string | null>(null);
  const [totalItemCount, setTotalItemCount] = useState<number | null>(null);

  // Assets state
  const [assets, setAssets] = useState<[string, StacAsset][]>([]);

  // Expanded collections state
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Preview dialog state
  const [previewAssets, setPreviewAssets] = useState<PreviewAsset[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const toggleCollectionExpanded = (collectionId: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  // Detect STAC resource type and route appropriately
  const detectAndLoadStacResource = async () => {
    try {
      setLoading(true);
      
      // First, fetch the root URL to detect the resource type
      const response = await fetch(serviceUrl);
      if (!response.ok) throw new Error('Failed to fetch STAC resource');
      
      const data = await response.json();
      
      // Special-case: openEO job results often return a STAC-like payload with top-level "assets"
      // but WITHOUT a STAC "type" field. Treat this as a single item and go straight to assets.
      if (data?.assets && typeof data.assets === 'object' && data.type !== 'Feature' && data.type !== 'FeatureCollection') {
        setDetectedMode('openEO-assets');
        const assetEntries = Object.entries(data.assets) as [string, StacAsset][];
        setAssets(assetEntries);
        setSelectedItem({
          id: data.id || 'result',
          properties: data.properties || { title: serviceName || 'STAC Result' },
          assets: data.assets,
          links: data.links,
        } as StacItem);
        setSelectedCollection({
          id: 'item',
          title: data.properties?.title || data.id || serviceName || 'STAC Result',
          description: data.properties?.description || data.description,
          links: data.links,
        });
        setCurrentStep('assets');
        setLoading(false);
        return;
      }

      // Check if it's a FeatureCollection (ItemCollection) - has type: "FeatureCollection" and features array
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        setDetectedMode('itemCollection');
        const itemsList = data.features as StacItem[];
        setItems(itemsList);
        setNextItemsUrl(extractNextLink(data));
        setTotalItemCount(data.numberMatched || data.context?.matched || itemsList.length);
        // Create a synthetic collection for display purposes
        setSelectedCollection({
          id: data.id || 'results',
          title: data.title || serviceName || 'STAC Results',
          description: data.description,
          links: data.links,
        });
        setCurrentStep('items');
        setLoading(false);
        return;
      }

      // Check if it's a single Feature (Item) - has type: "Feature" (standard STAC)
      if (data.type === 'Feature') {
        // If it has assets, show them; otherwise keep existing behavior
        if (data.assets) {
          setDetectedMode('stac-item');
          const assetEntries = Object.entries(data.assets) as [string, StacAsset][];
          setAssets(assetEntries);
          setSelectedItem(data as StacItem);
          setSelectedCollection({
            id: 'item',
            title: data.properties?.title || data.id || 'STAC Item',
            description: data.properties?.description,
            links: data.links,
          });
          setCurrentStep('assets');
          setLoading(false);
          return;
        }
      }

      // Otherwise, assume it's a Catalog - fetch collections
      setDetectedMode('catalog');
      await fetchCollectionsFromCatalog();

    } catch (error) {
      console.error('Error detecting STAC resource type:', error);
      // Fall back to trying collections endpoint
      setDetectedMode('catalog');
      await fetchCollectionsFromCatalog();
    }
  };

  const fetchCollectionsFromCatalog = async () => {
    try {
      setLoading(true);
      let allCollections: StacCollection[] = [];

      // IMPORTANT: do NOT append a trailing slash to signed URLs with query params.
      // Build the base URL without query/hash before appending STAC paths.
      const baseUrl = new URL(serviceUrl);
      baseUrl.search = '';
      baseUrl.hash = '';

      let currentUrl: string | null = ensureSlash(baseUrl.toString()) + 'collections?limit=100';
      
      while (currentUrl) {
        const response = await fetch(currentUrl);
        if (!response.ok) throw new Error('Failed to fetch collections');
        
        const data = await response.json();
        const collectionsList = data.collections || data;
        
        if (Array.isArray(collectionsList)) {
          allCollections = [...allCollections, ...collectionsList];
          currentUrl = extractNextLink(data);
        } else {
          throw new Error('Invalid collections response');
        }
      }
      
      setCollections(allCollections);
      setNextCollectionsUrl(null); // All collections loaded
      setLoading(false);
    } catch (error) {
      console.error('Error fetching STAC collections:', error);
      toast({
        title: "STAC Error",
        description: "Failed to fetch collections. Please check the catalogue URL.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };


  const fetchItems = async (collection: StacCollection) => {
    // Immediately update UI state before async fetch
    setCurrentStep('items');
    setSelectedCollection(collection);
    setSearchTerm('');
    setServerSearchTerm('');
    
    // Then start loading and fetch
    setLoading(true);
    
    try {
      const itemsUrl = getItemsUrl(collection, serviceUrl);
      const response = await fetch(itemsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      
      const itemsList = data.features || data.items || data;
      
      if (Array.isArray(itemsList)) {
        setItems(itemsList);
        setNextItemsUrl(extractNextLink(data));
        // Only set total count if we have a reliable count from the API
        const total = data.numberMatched || data.context?.matched || null;
        setTotalItemCount(total);
      } else {
        throw new Error('Invalid items response');
      }
    } catch (error) {
      console.error('Error fetching STAC items:', error);
      // Set empty items to show "No items found" message
      setItems([]);
      setNextItemsUrl(null);
      setTotalItemCount(null);
      toast({
        title: "STAC Error",
        description: `Failed to fetch items for collection "${collection.title || collection.id}".`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const loadMoreItems = async () => {
    if (!nextItemsUrl) return;
    
    try {
      setLoadingMore(true);
      const response = await fetch(nextItemsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch more items');
      
      const data = await response.json();
      const itemsList = data.features || data.items || data;
      
      if (Array.isArray(itemsList)) {
        setItems(prev => [...prev, ...itemsList]);
        setNextItemsUrl(extractNextLink(data));
      }
    } catch (error) {
      console.error('Error fetching more items:', error);
      toast({
        title: "STAC Error",
        description: "Failed to fetch more items.",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const selectItem = (item: StacItem) => {
    setSearchTerm(''); // Clear search when moving to assets step
    setServerSearchTerm(''); // Clear server search state
    setShowSupportedOnly(false); // Reset format filter
    if (item.assets) {
      const assetEntries = Object.entries(item.assets);
      setAssets(assetEntries);
      setSelectedItem(item);
      setCurrentStep('assets');
    } else {
      toast({
        title: "No Assets",
        description: "This item has no downloadable assets.",
        variant: "destructive"
      });
    }
  };

  const selectAsset = (assetKey: string, asset: StacAsset) => {
    const format = detectAssetFormat(asset);
    const resolved = resolveAssetUrl(asset.href, serviceUrl);
    const datetime = selectedItem?.properties?.datetime;
    onAssetSelect({ url: resolved, format, datetime });
  };

  const handleAddAllItems = async () => {
    const filteredItems = getFilteredData() as StacItem[];
    
    if (filteredItems.length === 0) {
      toast({
        title: "No Items",
        description: "No items to add. Please adjust your search filter.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const previewAssetsList: PreviewAsset[] = [];

    try {
      for (const item of filteredItems) {
        if (!item.assets || Object.keys(item.assets).length === 0) {
          console.warn(`Item ${item.id} has no assets, skipping...`);
          continue;
        }

        // Process ALL assets from each item, not just the first one
        for (const [assetKey, asset] of Object.entries(item.assets)) {
          try {
            const format = detectAssetFormat(asset);
            
            // Check if format is supported
            if (!SUPPORTED_FORMATS.includes(format as DataSourceFormat)) {
              console.warn(`Skipping asset ${assetKey} from item ${item.id}: unsupported format ${format}`);
              continue;
            }
            
            const resolved = resolveAssetUrl(asset.href, serviceUrl);
            const datetime = item.properties?.datetime;
            
            previewAssetsList.push({
              id: `${item.id}::${assetKey}`,
              itemId: item.id,
              assetKey,
              url: resolved,
              format,
              datetime,
              roles: asset.roles,
              fileSize: asset['file:size'],
              title: asset.title,
            });
          } catch (error) {
            console.error(`Failed to process asset ${assetKey} from item ${item.id}:`, error);
          }
        }
      }

      if (previewAssetsList.length > 0) {
        setPreviewAssets(previewAssetsList);
        setShowPreviewDialog(true);
      } else {
        toast({
          title: "No Supported Formats",
          description: "No supported asset formats found in the selected items. Only COG, GeoJSON, FlatGeobuf, WMS, WMTS, XYZ, WFS, and CSV are supported.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during bulk add:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing items.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllAssetsFromItem = (item: StacItem) => {
    if (!item.assets || Object.keys(item.assets).length === 0) {
      toast({
        title: "No Assets",
        description: "This item has no assets to add.",
        variant: "destructive"
      });
      return;
    }

    const previewAssetsList: PreviewAsset[] = [];

    for (const [assetKey, asset] of Object.entries(item.assets)) {
      try {
        const format = detectAssetFormat(asset);
        
        // Check if format is supported
        if (!SUPPORTED_FORMATS.includes(format as DataSourceFormat)) {
          continue;
        }
        
        const resolved = resolveAssetUrl(asset.href, serviceUrl);
        const datetime = item.properties?.datetime;
        
        previewAssetsList.push({
          id: `${item.id}::${assetKey}`,
          itemId: item.id,
          assetKey,
          url: resolved,
          format,
          datetime,
          roles: asset.roles,
          fileSize: asset['file:size'],
          title: asset.title,
        });
      } catch (error) {
        console.error(`Failed to process asset ${assetKey} from item ${item.id}:`, error);
      }
    }

    if (previewAssetsList.length > 0) {
      setPreviewAssets(previewAssetsList);
      setShowPreviewDialog(true);
    } else {
      toast({
        title: "No Supported Formats",
        description: "No supported asset formats found in this item.",
        variant: "destructive"
      });
    }
  };

  const handlePreviewConfirm = (selectedAssets: PreviewAsset[]) => {
    const assetSelections: AssetSelection[] = selectedAssets.map(asset => ({
      url: asset.url,
      format: asset.format,
      datetime: asset.datetime,
    }));

    onAssetSelect(assetSelections);
    
    toast({
      title: "Success",
      description: `Added ${assetSelections.length} data ${assetSelections.length === 1 ? 'source' : 'sources'} from STAC catalogue.`,
    });
  };

  const goBack = () => {
    if (currentStep === 'assets') {
      setCurrentStep('items');
      setAssets([]);
      setSelectedItem(null);
      setShowSupportedOnly(false); // Reset format filter when leaving assets
    } else if (currentStep === 'items') {
      setCurrentStep('collections');
      setItems([]);
      setNextItemsUrl(null);
      setSelectedCollection(null);
      setTotalItemCount(null);
      setServerSearchTerm(''); // Clear server search term for items
    }
    setSearchTerm('');
  };


  // When serviceUrl changes (new service selected), reset browser state and load appropriately
  useEffect(() => {
    // Reset state so we don't show previous service's collections/items
    setDetectedMode(null);
    setCurrentStep('collections');
    setCollections([]);
    setSelectedCollection(null);
    setNextCollectionsUrl(null);

    setItems([]);
    setSelectedItem(null);
    setNextItemsUrl(null);
    setTotalItemCount(null);

    setAssets([]);
    setSearchTerm('');
    setServerSearchTerm('');
    setShowSupportedOnly(false);
    setExpandedCollections(new Set());
    setExpandedItems(new Set());

    // Then detect what the URL actually returns (catalog vs itemcollection vs assets)
    detectAndLoadStacResource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceUrl]);

  // Delay skeleton display to prevent flicker on fast responses
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loading) {
      // Show skeleton after 500ms delay
      timeoutId = setTimeout(() => {
        setShowSkeleton(true);
      }, 500);
    } else {
      // Immediately hide skeleton when loading completes
      setShowSkeleton(false);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading]);

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    
    if (currentStep === 'collections') {
      return filterAndRankCollections(collections, searchTerm);
    } else if (currentStep === 'items') {
      // Client-side filtering for items
      const filtered = items.filter(i => {
        if (!term) return true; // Show all if no search term
        
        return i.id.toLowerCase().includes(term) ||
               (i.properties?.title && i.properties.title.toLowerCase().includes(term));
      });
      return filtered;
    } else if (currentStep === 'assets') {
      // Assets are filtered by both search term AND format support
      const filtered = assets.filter(([key, asset]) => {
        // Text search filter
        const matchesSearch = !term ||
          key.toLowerCase().includes(term) ||
          (asset.title && asset.title.toLowerCase().includes(term)) ||
          asset.href.toLowerCase().includes(term);
        
        // Format filter (only apply if showSupportedOnly is true)
        const matchesFormat = !showSupportedOnly || 
          SUPPORTED_FORMATS.includes(detectAssetFormat(asset) as DataSourceFormat);
        
        return matchesSearch && matchesFormat;
      });
      return filtered;
    }
    
    return [];
  };

  const getStepTitle = () => {
    if (currentStep === 'collections') return 'Select Collection';
    if (currentStep === 'items') return `Back to ${serviceName} list`;
    if (currentStep === 'assets') return `Back to ${selectedCollection?.title || selectedCollection?.id} items`;
    return '';
  };

  const getStepIcon = () => {
    if (currentStep === 'collections') return <Folder className="h-4 w-4" />;
    if (currentStep === 'items') return <FileText className="h-4 w-4" />;
    if (currentStep === 'assets') return <Download className="h-4 w-4" />;
    return null;
  };

  const getSelfLink = (links?: StacLink[]): string | null => {
    return links?.find(l => l.rel === 'self')?.href || null;
  };

  const renderInfoCard = () => {
    // Only show Service Info Card on collections view (not when collection or item is selected)
    if (currentStep === 'collections' && !selectedCollection && !selectedItem) {
      return (
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-4 w-4 text-purple-600" />
              <h3 className="font-medium text-purple-700">{serviceName}</h3>
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                STAC Catalogue
              </Badge>
              {collections.length > 0 && (
                <Badge variant="outline" className="border-green-300 text-green-700">
                  {collections.length} collections
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground overflow-hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a 
                      href={createStacBrowserUrl(serviceUrl, serviceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-start gap-1 break-all"
                    >
                      <span className="break-all">{serviceUrl}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open in STAC Browser</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </CardContent>
        </Card>
      );
    }
    
    // Show Collection Info Card on items view (when collection selected but no item)
    if (currentStep === 'items' && selectedCollection && !selectedItem) {
      const selfLink = getSelfLink(selectedCollection.links);
      return (
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-4 w-4 text-purple-600" />
              <h3 className="font-medium text-purple-700">
                {selectedCollection.title || selectedCollection.id}
              </h3>
              <Badge variant="outline" className="border-green-300 text-green-700">
                {totalItemCount !== null 
                  ? `${totalItemCount} items`
                  : nextItemsUrl 
                    ? `${items.length}+ items`
                    : `${items.length} items`}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground overflow-hidden">
              {selfLink ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={createStacBrowserUrl(selfLink, serviceUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-start gap-1 break-all"
                      >
                        <span className="break-all">{selfLink}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open in STAC Browser</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                `Collection: ${selectedCollection.id}`
              )}
            </p>
          </CardContent>
        </Card>
      );
    }
    
    // Show Item Info Card on assets view (when item is selected)
    if (currentStep === 'assets' && selectedItem) {
      const selfLink = getSelfLink(selectedItem.links);
      const totalAssetCount = Object.keys(selectedItem.assets || {}).length;
      return (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-blue-700">
                {selectedItem.properties?.title || selectedItem.id}
              </h3>
              <Badge variant="outline" className="border-green-300 text-green-700">
                {totalAssetCount} assets
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground overflow-hidden">
              {selfLink ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={createStacBrowserUrl(selfLink, serviceUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-start gap-1 break-all"
                      >
                        <span className="break-all">{selfLink}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open in STAC Browser</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                `Item: ${selectedItem.id}`
              )}
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  const filteredData = getFilteredData();
  const totalAssetCount = selectedItem?.assets ? Object.keys(selectedItem.assets).length : 0;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Detection mode indicator */}
      {detectedMode && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Detected:</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {detectedMode === 'catalog' && 'STAC Catalog'}
            {detectedMode === 'itemCollection' && 'ItemCollection'}
            {detectedMode === 'openEO-assets' && 'openEO Assets'}
            {detectedMode === 'stac-item' && 'STAC Item'}
          </Badge>
        </div>
      )}

      {/* Info Card */}
      {renderInfoCard()}

      {/* Header with back button and title - only for items and assets */}
      {currentStep !== 'collections' && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {getStepIcon()}
            <h3 className="font-medium">{getStepTitle()}</h3>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <input
            type="text"
            placeholder={`Search ${currentStep}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 p-2 border border-input rounded-md"
          />
        </div>
        
        {/* Format filter toggle - only for assets */}
        {currentStep === 'assets' && (
          <div className="flex items-center gap-2 px-1">
            <Switch 
              id="supported-only"
              checked={showSupportedOnly}
              onCheckedChange={setShowSupportedOnly}
            />
            <Label htmlFor="supported-only" className="cursor-pointer text-sm">
              Show only supported formats
            </Label>
          </div>
        )}
        
        {/* Count message - showing filtered results */}
        {!loading && filteredData.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {currentStep === 'items' && totalItemCount !== null ? (
              <>Showing {filteredData.length} items of {totalItemCount}</>
            ) : currentStep === 'assets' && totalAssetCount > 0 ? (
              <>Showing {filteredData.length} assets of {totalAssetCount}{showSupportedOnly ? ' (supported formats only)' : ''}</>
            ) : (
              <>Showing {filteredData.length} {currentStep}</>
            )}
            {searchTerm && ` matching "${searchTerm}"`}
            {currentStep === 'items' && nextItemsUrl && ' (more available)'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto border rounded-md relative min-h-0">
        {loading && showSkeleton && currentStep === 'collections' ? (
          <div className="grid gap-2 p-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-2 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <div className="flex gap-1 mt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : loading && showSkeleton && currentStep === 'items' ? (
          <div className="grid gap-2 p-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-2 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : loading && showSkeleton && currentStep === 'assets' ? (
          <div className="grid gap-2 p-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-2 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : loading && !showSkeleton ? (
          // Loading but skeleton not shown yet (< 500ms) - show nothing to prevent flicker
          <div className="h-96"></div>
        ) : (
          <>
            {/* Searching overlay */}
            {searching && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              </div>
            )}
            
            <div className="grid gap-2 p-2">
              {filteredData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground min-h-96 flex items-center justify-center">
                  <div>
                    {searchTerm ? (
                      <>
                        <p>No {currentStep} found matching "{searchTerm}"</p>
                        <p className="text-sm mt-2">Try different search terms</p>
                      </>
                    ) : (
                      <p>No {currentStep} available</p>
                    )}
                  </div>
                </div>
              ) : currentStep === 'collections' ? (
                // Collections view
                (filteredData as StacCollection[]).map((collection) => {
                  const isExpanded = expandedCollections.has(collection.id);
                  const hasLongDescription = collection.description && collection.description.length > 150;
                  const hasExtraKeywords = collection.keywords && collection.keywords.length > 5;
                  const shouldShowToggle = hasLongDescription || hasExtraKeywords;
                  
                  // Helper to highlight search terms
                  const highlightText = (text: string) => {
                    if (!searchTerm.trim()) return text;
                    
                    const term = searchTerm.trim();
                    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const parts = text.split(regex);
                    
                    return parts.map((part, i) => 
                      regex.test(part) ? <strong key={i}>{part}</strong> : part
                    );
                  };
                  
                  return (
                    <div key={collection.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Folder className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-sm">{highlightText(collection.title || collection.id)}</div>
                        {collection.description && (
                          <div className={`text-xs text-muted-foreground mt-1 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                            {highlightText(collection.description)}
                          </div>
                        )}
                        {collection.keywords && collection.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(isExpanded ? collection.keywords : collection.keywords.slice(0, 5)).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                {highlightText(keyword)}
                              </Badge>
                            ))}
                            {!isExpanded && collection.keywords.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{collection.keywords.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}
                        {shouldShowToggle && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollectionExpanded(collection.id);
                            }}
                            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                <span>Less</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                <span>More</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-shrink-0"
                        onClick={() => fetchItems(collection)}
                      >
                        Browse items
                      </Button>
                    </div>
                  );
                })
              ) : currentStep === 'items' ? (
                // Items view
                (filteredData as StacItem[]).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-sm">{item.properties?.title || item.id}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.properties?.datetime && (
                          <Badge variant="secondary" className="text-xs">
                            {new Date(item.properties.datetime).toLocaleDateString()}
                          </Badge>
                        )}
                        {item.assets && (
                          <span className="text-xs text-muted-foreground">
                            {Object.keys(item.assets).length} assets
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-shrink-0"
                      onClick={() => selectItem(item)}
                    >
                      View Assets
                    </Button>
                  </div>
                ))
              ) : (
                // Assets view
                (filteredData as [string, StacAsset][]).map(([key, asset]) => {
                  const format = detectAssetFormat(asset);
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Download className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-sm">{asset.title || key}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {format.toUpperCase()}
                          </Badge>
                          {asset.type && (
                            <span className="text-xs text-muted-foreground">{asset.type}</span>
                          )}
                          {asset['file:size'] && (
                            <span className="text-xs text-muted-foreground">
                              {(asset['file:size'] / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-shrink-0"
                                onClick={() => selectAsset(key, asset)}
                                disabled={!SUPPORTED_FORMATS.includes(format as DataSourceFormat)}
                              >
                                Select
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!SUPPORTED_FORMATS.includes(format as DataSourceFormat) && (
                            <TooltipContent>
                              <p>Unsupported asset format</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Load More button (items only) */}
      {!loading && currentStep === 'items' && nextItemsUrl && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMoreItems}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Items'}
            </Button>
          )}

      {/* Add All Button for Items - placed after the list */}
      {currentStep === 'items' && !loading && filteredData.length > 0 && (
        <Button
          variant="default"
          className="w-full"
          onClick={handleAddAllItems}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add All Filtered Items ({filteredData.length})
        </Button>
      )}

      {/* Add All Assets button when viewing single item's assets */}
      {currentStep === 'assets' && selectedItem && !loading && assets.length > 0 && (
        <Button
          variant="default"
          className="w-full"
          onClick={() => handleAddAllAssetsFromItem(selectedItem)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add All Supported Assets from This Item ({assets.filter(([key, asset]) => SUPPORTED_FORMATS.includes(detectAssetFormat(asset) as DataSourceFormat)).length})
        </Button>
      )}

      {/* Asset Preview Dialog */}
      <AssetPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        assets={previewAssets}
        onConfirm={handlePreviewConfirm}
      />
    </div>
  );
};

export default StacBrowser;