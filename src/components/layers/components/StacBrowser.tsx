import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Search, Folder, FileText, Download, Plus, Loader2 } from 'lucide-react';
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
  onAssetSelect: (assets: AssetSelection | AssetSelection[]) => void;
}

type BrowserStep = 'collections' | 'items' | 'assets';

const StacBrowser = ({ serviceUrl, onAssetSelect }: StacBrowserProps) => {
  const [currentStep, setCurrentStep] = useState<BrowserStep>('collections');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverSearchTerm, setServerSearchTerm] = useState(''); // Track the search term used for server fetch
  const { toast } = useToast();

  // Collections state
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<StacCollection | null>(null);
  const [nextCollectionsUrl, setNextCollectionsUrl] = useState<string | null>(null);

  // Items state
  const [items, setItems] = useState<StacItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StacItem | null>(null);
  const [nextItemsUrl, setNextItemsUrl] = useState<string | null>(null);

  // Assets state
  const [assets, setAssets] = useState<[string, StacAsset][]>([]);

  const ensureSlash = (url: string) => url.endsWith('/') ? url : url + '/';

  const appendQueryParam = (url: string, key: string, value: string | number) => {
    const hasQuery = url.includes('?');
    const separator = hasQuery ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
  };

  const getItemsUrl = (collection: StacCollection, searchQuery?: string) => {
    const link = collection.links?.find((l) => l.rel === 'items');
    let url = link?.href || (ensureSlash(serviceUrl) + `collections/${collection.id}/items`);
    if (!/[?&]limit=/.test(url)) {
      url = appendQueryParam(url, 'limit', 100);
    }
    // Add server-side search parameter if provided
    if (searchQuery && searchQuery.trim()) {
      url = appendQueryParam(url, 'q', searchQuery.trim());
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

  const fetchCollections = async (searchQuery?: string) => {
    try {
      // Use searching state when triggered by user search, loading for initial load
      if (searchQuery !== undefined) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      let collectionsUrl = ensureSlash(serviceUrl) + 'collections?limit=100';
      
      // Add server-side search parameter if provided
      if (searchQuery && searchQuery.trim()) {
        collectionsUrl = appendQueryParam(collectionsUrl, 'q', searchQuery.trim());
      }
      
      const response = await fetch(collectionsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch collections');
      
      const data = await response.json();
      const collectionsList = data.collections || data;
      
      if (Array.isArray(collectionsList)) {
        setCollections(collectionsList);
        setNextCollectionsUrl(extractNextLink(data));
        setServerSearchTerm(searchQuery || ''); // Track the search term used
      } else {
        throw new Error('Invalid collections response');
      }
    } catch (error) {
      console.error('Error fetching STAC collections:', error);
      toast({
        title: "STAC Error",
        description: "Failed to fetch collections. Please check the catalogue URL.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const loadMoreCollections = async () => {
    if (!nextCollectionsUrl) return;
    
    try {
      setLoadingMore(true);
      const response = await fetch(nextCollectionsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch more collections');
      
      const data = await response.json();
      const collectionsList = data.collections || data;
      
      if (Array.isArray(collectionsList)) {
        setCollections(prev => [...prev, ...collectionsList]);
        setNextCollectionsUrl(extractNextLink(data));
      }
    } catch (error) {
      console.error('Error fetching more collections:', error);
      toast({
        title: "STAC Error",
        description: "Failed to fetch more collections.",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchItems = async (collection: StacCollection, searchQuery?: string) => {
    try {
      // Use searching state when triggered by user search, loading for initial load
      if (searchQuery !== undefined) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      
      const itemsUrl = getItemsUrl(collection, searchQuery);
      const response = await fetch(itemsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      
      const itemsList = data.features || data.items || data;
      
      if (Array.isArray(itemsList)) {
        setItems(itemsList);
        setNextItemsUrl(extractNextLink(data));
        setSelectedCollection(collection);
        setCurrentStep('items');
        setServerSearchTerm(searchQuery || ''); // Track the search term used
        setSearchTerm(''); // Clear search input after setting items step
      } else {
        throw new Error('Invalid items response');
      }
    } catch (error) {
      console.error('Error fetching STAC items:', error);
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
    }
    setSearchTerm('');
    setServerSearchTerm('');
  };

  // Debounced search effect for server-side search
  useEffect(() => {
    if (currentStep === 'assets') return; // Don't trigger server search on assets step
    
    const timeoutId = setTimeout(() => {
      if (currentStep === 'collections') {
        fetchCollections(searchTerm);
      } else if (currentStep === 'items' && selectedCollection) {
        fetchItems(selectedCollection, searchTerm);
      }
    }, 1200); // 1200ms debounce delay for natural pause in typing

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentStep]);

  // Initial load
  useEffect(() => {
    if (currentStep === 'collections' && collections.length === 0) {
      fetchCollections();
    }
  }, [serviceUrl]);

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    
    if (currentStep === 'collections') {
      // Only apply client-side filtering if no server search was performed
      // or if user is typing something different from the server search
      const filtered = collections.filter(c => {
        if (!term) return true; // Show all if no search term
        if (serverSearchTerm) return true; // Server already filtered, show all results
        
        // Client-side fallback filtering (for STAC APIs that don't support 'q' parameter)
        return (c.title && c.title.toLowerCase().includes(term)) ||
               c.id.toLowerCase().includes(term) ||
               (c.description && c.description.toLowerCase().includes(term));
      });
      return filtered;
    } else if (currentStep === 'items') {
      // Only apply client-side filtering if no server search was performed
      const filtered = items.filter(i => {
        if (!term) return true; // Show all if no search term
        if (serverSearchTerm) return true; // Server already filtered, show all results
        
        // Client-side fallback filtering
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

  const filteredData = getFilteredData();

  return (
    <div className="space-y-4">
      {/* Header with back button and title */}
      <div className="flex items-center gap-2">
        {currentStep !== 'collections' && (
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          {getStepIcon()}
          <h3 className="font-medium">{getStepTitle()}</h3>
        </div>
      </div>

      {/* Search */}
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

      {/* Content */}
      {loading ? (
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="min-h-96 max-h-96 overflow-y-auto border rounded-md relative">
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
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? (
                    <>
                      <p>No {currentStep} found matching "{searchTerm}"</p>
                      <p className="text-sm mt-2">Try different search terms</p>
                    </>
                  ) : (
                    <p>No {currentStep} available</p>
                  )}
                </div>
              ) : currentStep === 'collections' ? (
                // Collections view
                (filteredData as StacCollection[]).map((collection) => (
                  <div key={collection.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Folder className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-sm">{collection.title || collection.id}</div>
                      {collection.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {collection.description}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-shrink-0"
                      onClick={() => fetchItems(collection)}
                    >
                      Browse
                    </Button>
                  </div>
                ))
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
          </div>

          {/* Load More buttons */}
          {currentStep === 'collections' && nextCollectionsUrl && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMoreCollections}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Collections'}
            </Button>
          )}
          {currentStep === 'items' && nextItemsUrl && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMoreItems}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Items'}
            </Button>
          )}
        </>
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

      {/* Footer info */}
      {!loading && filteredData.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredData.length} {currentStep}
          {searchTerm && ` matching "${searchTerm}"`}
          {currentStep === 'collections' && nextCollectionsUrl && ' (more available)'}
          {currentStep === 'items' && nextItemsUrl && ' (more available)'}
        </div>
      )}
    </div>
  );
};

export default StacBrowser;