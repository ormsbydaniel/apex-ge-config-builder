import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, File, Search, AlertCircle, ListPlus, FileUp, Folder, ChevronRight, Home } from 'lucide-react';
import { fetchS3BucketFolder, deriveFolderListingFromObjects, getFormatFromExtension, getS3DisplayName, S3Object, S3Selection } from '@/utils/s3Utils';
import { DataSourceFormat, ServiceCapabilities } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface S3LayerSelectorProps {
  bucketUrl: string;
  capabilities?: ServiceCapabilities | null;
  onObjectSelect: (selection: S3Selection | S3Selection[]) => void;
}

const S3LayerSelector = ({ bucketUrl, capabilities, onObjectSelect }: S3LayerSelectorProps) => {
  const { toast } = useToast();
  const [allCachedObjects, setAllCachedObjects] = useState<S3Object[]>([]);
  const [files, setFiles] = useState<S3Object[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<S3Object[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState('');

  const fetchFolder = useCallback(async (prefix: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (usingCachedData && allCachedObjects.length > 0) {
        const listing = deriveFolderListingFromObjects(allCachedObjects, prefix);
        setFolders(listing.folders);
        setFiles(listing.files);
      } else {
        const listing = await fetchS3BucketFolder(bucketUrl, prefix);
        setFolders(listing.folders);
        setFiles(listing.files.filter(obj => !obj.key.endsWith('/')));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket contents');
    } finally {
      setIsLoading(false);
    }
  }, [bucketUrl, usingCachedData, allCachedObjects]);

  useEffect(() => {
    if (!bucketUrl) return;

    if (capabilities?.layers && capabilities.layers.length > 0) {
      const cachedObjects: S3Object[] = capabilities.layers.map(layer => ({
        key: layer.name,
        lastModified: 'From file upload',
        size: 0,
        url: `${bucketUrl}/${layer.name}`
      }));
      setAllCachedObjects(cachedObjects);
      setUsingCachedData(true);
      const listing = deriveFolderListingFromObjects(cachedObjects, '');
      setFolders(listing.folders);
      setFiles(listing.files);
    } else {
      setUsingCachedData(false);
      setAllCachedObjects([]);
      setCurrentPrefix('');
      fetchFolder('');
    }
  }, [bucketUrl, capabilities]);

  useEffect(() => {
    if (!bucketUrl) return;
    fetchFolder(currentPrefix);
  }, [currentPrefix, fetchFolder]);

  useEffect(() => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(obj =>
        getS3DisplayName(obj.key).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFormat !== 'all') {
      filtered = filtered.filter(obj => {
        const detectedFormat = getFormatFromExtension(obj.key);
        return detectedFormat === selectedFormat;
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchTerm, selectedFormat]);

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

      filteredFiles.forEach(object => {
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
    files.forEach(obj => {
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

  const navigateToFolder = (prefix: string) => {
    setSearchTerm('');
    setSelectedFormat('all');
    setCurrentPrefix(prefix);
  };

  const breadcrumbSegments = currentPrefix
    ? currentPrefix.replace(/\/$/, '').split('/')
    : [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading bucket contents...</span>
      </div>
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
          <Button onClick={() => fetchFolder(currentPrefix)} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 flex-1 flex flex-col min-h-0">
      <CardContent className="space-y-4 pt-6 flex-1 flex flex-col min-h-0">
        {/* Cached data indicator */}
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
              className="w-full p-2 border border-input rounded-md bg-background text-foreground"
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

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-sm bg-muted/50 px-3 py-2 rounded-md border border-border/50 flex-wrap">
          <button
            onClick={() => navigateToFolder('')}
            className={`flex items-center gap-1 hover:text-primary transition-colors ${
              currentPrefix === '' ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Root</span>
          </button>
          {breadcrumbSegments.map((segment, index) => {
            const segmentPrefix = breadcrumbSegments.slice(0, index + 1).join('/') + '/';
            const isLast = index === breadcrumbSegments.length - 1;
            return (
              <React.Fragment key={segmentPrefix}>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <button
                  onClick={() => !isLast && navigateToFolder(segmentPrefix)}
                  className={`hover:text-primary transition-colors ${
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  } ${isLast ? 'cursor-default' : 'cursor-pointer'}`}
                  disabled={isLast}
                >
                  {segment}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Folder and file list - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
          {/* Folder list */}
          {folders.length > 0 && (
            <div className="grid gap-1 p-2">
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => navigateToFolder(folder)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left w-full"
                >
                  <Folder className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-sm">{getS3DisplayName(folder)}/</span>
                </button>
              ))}
            </div>
          )}

          {/* Files list */}
          {filteredFiles.length === 0 && folders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No supported files found at this location</p>
              <p className="text-sm mt-1">
                Supported formats: FlatGeoBuf (.fgb), COG (.tif/.tiff), GeoJSON (.geojson/.json)
              </p>
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="grid gap-2 p-2">
              {filteredFiles.map((object, index) => {
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
                          <span className="font-medium text-sm break-words line-clamp-2 block">
                            {getS3DisplayName(object.key)}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {detectedFormat && (
                              <Badge variant="secondary" className="text-xs">
                                {detectedFormat.toUpperCase()}
                              </Badge>
                            )}
                            {object.size > 0 && (
                              <span className="text-xs text-muted-foreground">{formatSize(object.size)}</span>
                            )}
                            {object.lastModified !== 'From file upload' && (
                              <span className="text-xs text-muted-foreground">{new Date(object.lastModified).toLocaleDateString()}</span>
                            )}
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
          ) : null}
        </div>

        {/* Add All Objects Button */}
        {filteredFiles.length > 0 && (
          <Button
            onClick={handleAddAllObjects}
            disabled={isBulkAdding}
            className="w-full"
            variant="default"
          >
            {isBulkAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding {filteredFiles.length} objects...
              </>
            ) : (
              <>
                <ListPlus className="h-4 w-4 mr-2" />
                Add All Objects ({filteredFiles.length})
              </>
            )}
          </Button>
        )}

        {/* Status text */}
        {(files.length > 0 || folders.length > 0) && (
          <div className="text-xs text-muted-foreground">
            Showing {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            {folders.length > 0 && `, ${folders.length} folder${folders.length !== 1 ? 's' : ''}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default S3LayerSelector;
