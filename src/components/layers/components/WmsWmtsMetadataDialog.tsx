import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { DataSourceFormat } from '@/types/config';
import { Badge } from '@/components/ui/badge';

interface WmsWmtsMetadataDialogProps {
  url: string;
  format: DataSourceFormat;
  layerName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const WmsWmtsMetadataDialog = ({ 
  url, 
  format,
  layerName,
  isOpen, 
  onClose 
}: WmsWmtsMetadataDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && url) {
      loadCapabilities();
    }
  }, [isOpen, url]);

  const loadCapabilities = async () => {
    setLoading(true);
    setError(null);
    setCapabilities(null);

    try {
      const data = await fetchServiceCapabilities(url, format);
      if (!data) {
        throw new Error('No capabilities data returned');
      }
      setCapabilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capabilities');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadCapabilities();
  };

  // Find the specific layer if layerName is provided
  const currentLayer = layerName && capabilities?.layers 
    ? capabilities.layers.find((l: any) => l.name === layerName)
    : null;

  const displayLayers = currentLayer ? [currentLayer] : capabilities?.layers || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{format.toUpperCase()} GetCapabilities</DialogTitle>
          <DialogDescription className="break-all">
            {url}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading capabilities...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Error Loading Capabilities</h3>
                <p className="text-sm text-destructive/90">{error}</p>
                {error.includes('CORS') && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This may be due to CORS restrictions on the service.
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {capabilities && (
          <div className="space-y-6">
            {/* Service Information */}
            {(capabilities.title || capabilities.abstract) && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  Service Information
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {capabilities.title && (
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                            Title
                          </td>
                          <td className="py-2 px-3 text-sm">
                            {capabilities.title}
                          </td>
                        </tr>
                      )}
                      {capabilities.abstract && (
                        <tr className="hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                            Abstract
                          </td>
                          <td className="py-2 px-3 text-sm">
                            {capabilities.abstract}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Layers */}
            {displayLayers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  {currentLayer ? 'Layer Details' : `Available Layers (${displayLayers.length})`}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {displayLayers.map((layer: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">
                              {layer.title}
                            </h4>
                            {layer.hasTimeDimension && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                Temporal
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {layer.name}
                          </p>
                        </div>
                      </div>
                      {layer.abstract && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {layer.abstract}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayLayers.length === 0 && !loading && !error && (
              <div className="text-center py-8 text-muted-foreground">
                No layers found in capabilities document.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WmsWmtsMetadataDialog;
