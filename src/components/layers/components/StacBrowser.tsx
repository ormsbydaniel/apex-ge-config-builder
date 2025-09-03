import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Search, Folder, FileText, Download } from 'lucide-react';
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

interface StacBrowserProps {
  serviceUrl: string;
  onAssetSelect: (assetUrl: string, format: DataSourceFormat) => void;
}

type BrowserStep = 'collections' | 'items' | 'assets';

const StacBrowser = ({ serviceUrl, onAssetSelect }: StacBrowserProps) => {
  const [currentStep, setCurrentStep] = useState<BrowserStep>('collections');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Collections state
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<StacCollection | null>(null);

  // Items state
  const [items, setItems] = useState<StacItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StacItem | null>(null);

  // Assets state
  const [assets, setAssets] = useState<[string, StacAsset][]>([]);

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

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const collectionsUrl = ensureSlash(serviceUrl) + 'collections?limit=100';
      const response = await fetch(collectionsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch collections');
      
      const data = await response.json();
      const collectionsList = data.collections || data;
      
      if (Array.isArray(collectionsList)) {
        setCollections(collectionsList);
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
    }
  };

  const fetchItems = async (collection: StacCollection) => {
    try {
      setLoading(true);
      const itemsUrl = getItemsUrl(collection);
      console.log('Fetching items from URL:', itemsUrl);
      const response = await fetch(itemsUrl);
      
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      console.log('Raw items response:', data);
      console.log('Response type:', data.type);
      console.log('Features array:', data.features);
      console.log('Items array:', data.items);
      
      const itemsList = data.features || data.items || data;
      console.log('Processed items list:', itemsList);
      console.log('Items list is array:', Array.isArray(itemsList));
      console.log('Items list length:', itemsList?.length);
      
      if (Array.isArray(itemsList)) {
        setItems(itemsList);
        setSelectedCollection(collection);
        setCurrentStep('items');
        console.log('Successfully set items, moving to items step');
      } else {
        console.error('Items list is not an array:', itemsList);
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
    }
  };

  const selectItem = (item: StacItem) => {
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
    onAssetSelect(asset.href, format);
  };

  const goBack = () => {
    if (currentStep === 'assets') {
      setCurrentStep('items');
      setAssets([]);
      setSelectedItem(null);
    } else if (currentStep === 'items') {
      setCurrentStep('collections');
      setItems([]);
      setSelectedCollection(null);
    }
    setSearchTerm('');
  };

  useEffect(() => {
    if (currentStep === 'collections' && collections.length === 0) {
      fetchCollections();
    }
  }, [currentStep, serviceUrl]);

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    
    if (currentStep === 'collections') {
      return collections.filter(c => 
        !term || 
        (c.title && c.title.toLowerCase().includes(term)) ||
        c.id.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    } else if (currentStep === 'items') {
      return items.filter(i => 
        !term ||
        i.id.toLowerCase().includes(term) ||
        (i.properties?.title && i.properties.title.toLowerCase().includes(term))
      );
    } else if (currentStep === 'assets') {
      return assets.filter(([key, asset]) =>
        !term ||
        key.toLowerCase().includes(term) ||
        (asset.title && asset.title.toLowerCase().includes(term)) ||
        asset.href.toLowerCase().includes(term)
      );
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
        <input
          type="text"
          placeholder={`Search ${currentStep}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-2 border border-input rounded-md"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="max-h-96 overflow-y-auto border rounded-md">
          <div className="grid gap-2 p-2">
            {filteredData.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No {currentStep} found
                {searchTerm && ` matching "${searchTerm}"`}
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
      )}

      {/* Footer info */}
      {!loading && filteredData.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredData.length} {currentStep}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
};

export default StacBrowser;