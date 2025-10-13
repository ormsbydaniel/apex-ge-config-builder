
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, File, Search, AlertCircle, ListPlus, FileUp } from 'lucide-react';
import { fetchS3BucketContents, getFormatFromExtension, S3Object, S3Selection } from '@/utils/s3Utils';
import { DataSourceFormat, ServiceCapabilities } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface S3LayerSelectorProps {
  bucketUrl: string;
  capabilities?: ServiceCapabilities | null;
  onObjectSelect: (selection: S3Selection | S3Selection[]) => void;
}

const S3LayerSelector = ({ bucketUrl, capabilities, onObjectSelect }: S3LayerSelectorProps) => {
  const { toast } = useToast();
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<S3Object[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [usingCachedData, setUsingCachedData] = useState(false);

  useEffect(() => {
    if (bucketUrl) {
      fetchObjects();
    }
  }, [bucketUrl, capabilities]);

  useEffect(() => {
    filterObjects();
  }, [objects, searchTerm, selectedFormat]);

  const fetchObjects = async () => {
    setIsLoading(true);
    setError(null);
    setUsingCachedData(false);
    
    try {
      // If we have cached capabilities from file upload, use those instead of fetching
      if (capabilities?.layers && capabilities.layers.length > 0) {
        console.log('Using cached S3 bucket data from file upload', capabilities);
        
        // Transform capabilities layers to S3Object format
        const cachedObjects: S3Object[] = capabilities.layers.map(layer => ({
          key: layer.name,
          lastModified: 'From file upload',
          size: 0,
          url: `${bucketUrl}/${layer.name}`
        }));
        
        setObjects(cachedObjects);
        setUsingCachedData(true);
      } else {
        // Fetch live from S3 bucket (requires CORS)
        const fetchedObjects = await fetchS3BucketContents(bucketUrl);
        
        // Filter out folders (keys ending with /)
        const files = fetchedObjects.filter(obj => !obj.key.endsWith('/'));
        
        setObjects(files);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket contents');
    } finally {
      setIsLoading(false);
    }
  };

  const filterObjects = () => {
    let filtered = objects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(obj => 
        obj.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by format
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(obj => {
        const detectedFormat = getFormatFromExtension(obj.key);
        return detectedFormat === selectedFormat;
      });
    }

    setFilteredObjects(filtered);
  };

  const handleObjectSelect = (object: S3Object) => {
    const detectedFormat = getFormatFromExtension(object.key);
    if (detectedFormat) {
      const selection: S3Selection = {
        url: object.url,
        format: detectedFormat,
        key: object.key
      };
      onObjectSelect(selection);
    }
  };

  const handleAddAllObjects = async () => {
    setIsBulkAdding(true);
    
    try {
      const selections: S3Selection[] = [];
      const skipped: string[] = [];

      filteredObjects.forEach(object => {
        const detectedFormat = getFormatFromExtension(object.key);
        if (detectedFormat) {
          selections.push({
            url: object.url,
            format: detectedFormat,
            key: object.key
          });
        } else {
          skipped.push(object.key);
        }
      });

      if (selections.length > 0) {
        onObjectSelect(selections);
        
        toast({
          title: "Objects Added",
          description: `Added ${selections.length} data sources${skipped.length > 0 ? ` (${skipped.length} skipped due to unrecognized format)` : ''}.`,
        });
      } else {
        toast({
          title: "No Objects Added",
          description: "No objects with recognized formats found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add objects.",
        variant: "destructive",
      });
    } finally {
      setIsBulkAdding(false);
    }
  };

  const getAvailableFormats = () => {
    const formats = new Set<string>();
    objects.forEach(obj => {
      const format = getFormatFromExtension(obj.key);
      if (format) {
        formats.add(format);
      }
    });
    return Array.from(formats);
  };

  const formatSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading bucket contents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading bucket contents</span>
          </div>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button onClick={fetchObjects} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-4 pt-6">
        {/* Show indicator if using cached data */}
        {usingCachedData && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
            <FileUp className="h-4 w-4" />
            <span>Using cached data from file upload (no CORS required)</span>
          </div>
        )}
        
        {/* Search and Filter Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Objects</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="formatFilter">Filter by Format</Label>
            <select
              id="formatFilter"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full p-2 border border-input rounded-md"
            >
              <option value="all">All formats</option>
              {getAvailableFormats().map(format => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add All Objects Button */}
        {filteredObjects.length > 0 && (
          <Button
            onClick={handleAddAllObjects}
            disabled={isBulkAdding}
            className="w-full"
            variant="default"
          >
            {isBulkAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding {filteredObjects.length} objects...
              </>
            ) : (
              <>
                <ListPlus className="h-4 w-4 mr-2" />
                Add All Objects ({filteredObjects.length})
              </>
            )}
          </Button>
        )}

        {/* Objects List */}
        {filteredObjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No supported files found in bucket</p>
            <p className="text-sm mt-1">
              Supported formats: FlatGeoBuf (.fgb), COG (.tif/.tiff), GeoJSON (.geojson/.json)
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-md">
            <div className="grid gap-2 p-2">
              {filteredObjects.map((object, index) => {
                const detectedFormat = getFormatFromExtension(object.key);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleObjectSelect(object)}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-start gap-2 mb-1">
                        <File className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm break-words line-clamp-2 block">{object.key}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {detectedFormat && (
                              <Badge variant="secondary" className="text-xs">
                                {detectedFormat.toUpperCase()}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatSize(object.size)}</span>
                            <span className="text-xs text-muted-foreground">{new Date(object.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0 self-center">
                      Select
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {objects.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Showing {filteredObjects.length} of {objects.length} objects
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default S3LayerSelector;
