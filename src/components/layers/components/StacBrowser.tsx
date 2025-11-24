import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronDown, ChevronUp, Search, Folder, FileText, Download, Plus, Loader2 } from 'lucide-react';
import { DataSourceFormat } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface StacLink {
  rel: string;
  href: string;
  type?: string;
  method?: string;
}

interface StacCollection {
  id: string;
  title?: string;
  description?: string;
  keywords?: string[];
  extent?: any;
  links?: StacLink[];
}

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

interface StacAsset {
  href: string;
  type?: string;
  title?: string;
  roles?: string[];
  'file:size'?: number;
}

export interface AssetSelection {
  url: string;
  format: DataSourceFormat;
  datetime?: string;
}

interface StacBrowserProps {
  serviceUrl: string;
  serviceName: string;
  onAssetSelect: (assets: AssetSelection | AssetSelection[]) => void;
}

type BrowserStep = 'collections' | 'items' | 'assets';

const StacBrowser = ({ serviceUrl, serviceName, onAssetSelect }: StacBrowserProps) => {
  const [currentStep, setCurrentStep] = useState<BrowserStep>('collections');
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverSearchTerm, setServerSearchTerm] = useState(''); // Track the search term used for server fetch (items only)
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

  const ensureSlash = (url: string) => url.endsWith('/') ? url : url + '/';

  const appendQueryParam = (url: string, key: string, value: string | number) => {
    const hasQuery = url.includes('?');
    const separator = hasQuery ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
  };

  const getItemsUrl = (collection: StacCollection) => {
    const link = collection.links?.find((l) => l.rel === 'items');
    let url = link?.href || (ensureSlash(serviceUrl) + `collections/${collection.id}/items`);
    if (!/[?&]limit=/.test(url)) {
      url = appendQueryParam(url, 'limit', 100);
    }
    return url;
  };

  const extractNextLink = (data: any): string | null => {
    const links = data.links || [];
    const nextLink = links.find((link: any) => link.rel === 'next');
    return nextLink?.href || null;
  };

  const detectAssetFormat = (asset: StacAsset): DataSourceFormat => {
    const href = asset.href.toLowerCase();
    const type = asset.type?.toLowerCase() || '';
    
    // Check by media type first
    if (type.includes('tiff') || type.includes('geotiff')) return 'cog';
    if (type.includes('json')) return 'geojson';
    if (type.includes('flatgeobuf')) return 'flatgeobuf';
    
    // Check by file extension
    if (href.includes('.tif') || href.includes('.tiff')) return 'cog';
    if (href.includes('.json') || href.includes('.geojson')) return 'geojson';
    if (href.includes('.fgb')) return 'flatgeobuf';
    
    // Default to COG for unknown formats (most STAC assets are raster data)
    return 'cog';
  };

  const fetchAllCollections = async () => {
    try {
      setLoading(true);
      let allCollections: StacCollection[] = [];
      let currentUrl: string | null = ensureSlash(serviceUrl) + 'collections?limit=100';
      
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
      const itemsUrl = getItemsUrl(collection);
      const response = await fetch(itemsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      
      const itemsList = data.features || data.items || data;
      
      if (Array.isArray(itemsList)) {
        setItems(itemsList);
        setNextItemsUrl(extractNextLink(data));
        // Extract total count from response (numberMatched, context.matched, or context.returned)
        const total = data.numberMatched || data.context?.matched || data.context?.returned || itemsList.length;
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

  // Helper to resolve STAC asset URLs (absolute, root-relative, or relative)
  const resolveAssetUrl = (href: string) => {
    try {
      if (/^https?:\/\//i.test(href) || href.startsWith('data:')) return href;
      const origin = new URL(serviceUrl).origin;
      if (href.startsWith('/')) return origin + href;
      return new URL(href, ensureSlash(serviceUrl)).toString();
    } catch (e) {
      console.warn('Failed to resolve asset URL, returning original href', href, e);
      return href;
    }
  };

  const selectAsset = (assetKey: string, asset: StacAsset) => {
    const format = detectAssetFormat(asset);
    const resolved = resolveAssetUrl(asset.href);
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
    const assetSelections: AssetSelection[] = [];
    let processedCount = 0;
    let failedCount = 0;

    try {
      for (const item of filteredItems) {
        processedCount++;
        
        if (!item.assets || Object.keys(item.assets).length === 0) {
          console.warn(`Item ${item.id} has no assets, skipping...`);
          failedCount++;
          continue;
        }

        // Get the first asset from each item
        const [assetKey, asset] = Object.entries(item.assets)[0];
        
        try {
          const format = detectAssetFormat(asset);
          const resolved = resolveAssetUrl(asset.href);
          const datetime = item.properties?.datetime; // Get datetime from item properties
          
          assetSelections.push({
            url: resolved,
            format,
            datetime
          });
        } catch (error) {
          console.error(`Failed to process asset ${assetKey} from item ${item.id}:`, error);
          failedCount++;
        }
      }

      if (assetSelections.length > 0) {
        onAssetSelect(assetSelections);
        
        if (failedCount > 0) {
          toast({
            title: "Partial Success",
            description: `Added ${assetSelections.length} of ${processedCount} data sources (${failedCount} failed).`,
          });
        } else {
          toast({
            title: "Success",
            description: `Added ${assetSelections.length} data sources from STAC catalogue.`,
          });
        }
      } else {
        toast({
          title: "Failed",
          description: "Failed to process any items. Check console for details.",
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

  const goBack = () => {
    if (currentStep === 'assets') {
      setCurrentStep('items');
      setAssets([]);
      setSelectedItem(null);
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


  // Initial load - fetch all collections
  useEffect(() => {
    if (currentStep === 'collections' && collections.length === 0) {
      fetchAllCollections();
    }
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

  // Rank a collection based on search term matches
  const rankCollection = (collection: StacCollection, searchTerm: string): number => {
    const term = searchTerm.toLowerCase().trim();
    let score = 0;
    
    const title = (collection.title || collection.id).toLowerCase();
    const description = (collection.description || '').toLowerCase();
    const keywords = (collection.keywords || []).map(k => k.toLowerCase());
    
    // Create word boundary regex for whole-word matching
    const wholeWordRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    // Title matches (highest priority)
    if (title === term) {
      score += 1000; // Exact match
    } else if (wholeWordRegex.test(collection.title || collection.id)) {
      score += 500; // Whole word match
    } else if (title.startsWith(term)) {
      score += 400; // Starts with search term
    } else if (title.includes(term)) {
      score += 300; // Partial match in title
    }
    
    // Keywords matches
    keywords.forEach(keyword => {
      if (keyword === term) {
        score += 250; // Exact keyword match
      } else if (wholeWordRegex.test(keyword)) {
        score += 200; // Whole word in keyword
      } else if (keyword.includes(term)) {
        score += 50; // Partial match in keyword
      }
    });
    
    // Description matches (lower priority)
    if (wholeWordRegex.test(description)) {
      score += 100; // Whole word in description
    } else if (description.includes(term)) {
      score += 25; // Partial match in description
    }
    
    return score;
  };

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    
    if (currentStep === 'collections') {
      if (!term) return collections; // Show all if no search term
      
      // Filter and rank collections by score
      const rankedCollections = collections
        .map(c => ({ collection: c, score: rankCollection(c, term) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.collection);
      
      return rankedCollections;
    } else if (currentStep === 'items') {
      // Client-side filtering for items
      const filtered = items.filter(i => {
        if (!term) return true; // Show all if no search term
        
        return i.id.toLowerCase().includes(term) ||
               (i.properties?.title && i.properties.title.toLowerCase().includes(term));
      });
      return filtered;
    } else if (currentStep === 'assets') {
      // Assets are always filtered client-side (no server-side search for assets)
      const filtered = assets.filter(([key, asset]) =>
        !term ||
        key.toLowerCase().includes(term) ||
        (asset.title && asset.title.toLowerCase().includes(term)) ||
        asset.href.toLowerCase().includes(term)
      );
      return filtered;
    }
    
    return [];
  };

  const getStepTitle = () => {
    if (currentStep === 'collections') return 'Select Collection';
    if (currentStep === 'items') return `Items in ${selectedCollection?.title || selectedCollection?.id}`;
    if (currentStep === 'assets') return `Assets in ${selectedItem?.properties?.title || selectedItem?.id}`;
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
            <p className="text-sm text-muted-foreground">{serviceUrl}</p>
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
              {totalItemCount !== null && (
                <Badge variant="outline" className="border-green-300 text-green-700">
                  {totalItemCount} items
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {selfLink || `Collection: ${selectedCollection.id}`}
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
            <p className="text-sm text-muted-foreground">
              {selfLink || `Item: ${selectedItem.id}`}
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
        
        {/* Count message - showing filtered results */}
        {!loading && filteredData.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {currentStep === 'items' && totalItemCount !== null ? (
              <>Showing {filteredData.length} items of {totalItemCount}</>
            ) : currentStep === 'assets' && totalAssetCount > 0 ? (
              <>Showing {filteredData.length} assets of {totalAssetCount}</>
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-shrink-0"
                        onClick={() => selectAsset(key, asset)}
                      >
                        Select
                      </Button>
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
    </div>
  );
};

export default StacBrowser;