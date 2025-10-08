import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { fetchFlatGeobufMetadata, FlatGeobufMetadata } from '@/utils/flatgeobufMetadata';
import { toast } from '@/hooks/use-toast';

interface FlatGeobufMetadataDialogProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlatGeobufMetadataDialog = ({ url, open, onOpenChange }: FlatGeobufMetadataDialogProps) => {
  const [metadata, setMetadata] = useState<FlatGeobufMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !metadata) {
      fetchMetadata();
    }
  }, [open]);

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFlatGeobufMetadata(url);
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBounds = () => {
    if (metadata) {
      const boundsText = `[${metadata.bounds.minX}, ${metadata.bounds.minY}, ${metadata.bounds.maxX}, ${metadata.bounds.maxY}]`;
      navigator.clipboard.writeText(boundsText);
      toast({
        title: 'Copied to clipboard',
        description: 'Bounding box coordinates copied',
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FlatGeobuf Metadata</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-destructive p-4 rounded-md bg-destructive/10">
            {error}
          </div>
        )}

        {metadata && (
          <div className="space-y-6">
            {/* File Properties */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">File Properties</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">File Size:</span>
                  <span className="ml-2 text-muted-foreground">{formatFileSize(metadata.fileSize)}</span>
                </div>
                <div>
                  <span className="font-medium">Feature Count:</span>
                  <span className="ml-2 text-muted-foreground">{metadata.featureCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Has Spatial Index:</span>
                  <span className="ml-2 text-muted-foreground">
                    {metadata.hasSpatialIndex ? (
                      <CheckCircle2 className="h-4 w-4 inline text-success" />
                    ) : (
                      'No'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Geometry */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Geometry</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Geometry Type:</span>
                  <span className="ml-2 text-muted-foreground">{metadata.geometryType}</span>
                </div>
                <div>
                  <span className="font-medium">CRS:</span>
                  <span className="ml-2 text-muted-foreground">{metadata.crs}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Bounding Box:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBounds}
                    className="h-7"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
                  <div>Min X: {metadata.bounds.minX.toFixed(6)}</div>
                  <div>Max X: {metadata.bounds.maxX.toFixed(6)}</div>
                  <div>Min Y: {metadata.bounds.minY.toFixed(6)}</div>
                  <div>Max Y: {metadata.bounds.maxY.toFixed(6)}</div>
                </div>
              </div>
            </div>

            {/* Schema */}
            {metadata.columns.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Schema ({metadata.columns.length} columns)</h3>
                <div className="border rounded-md">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">Column Name</th>
                          <th className="text-left p-2 font-medium">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metadata.columns.map((col, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 font-mono">{col.name}</td>
                            <td className="p-2 text-muted-foreground">{col.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlatGeobufMetadataDialog;
