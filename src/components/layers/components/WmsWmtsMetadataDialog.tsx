import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Eye, Copy, ArrowLeft } from 'lucide-react';
import { fetchServiceCapabilities } from '@/utils/serviceCapabilities';
import { DataSourceFormat, DataSourceLayout } from '@/types/config';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface WmsWmtsMetadataDialogProps {
  url: string;
  format: DataSourceFormat;
  layerName?: string;
  isOpen: boolean;
  onClose: () => void;
  sourceName?: string;
  currentLayout?: DataSourceLayout;
  onUpdateLayout?: (updates: Partial<DataSourceLayout>) => void;
}

const WmsWmtsMetadataDialog = ({ 
  url, 
  format,
  layerName,
  isOpen, 
  onClose,
  sourceName,
  currentLayout,
  onUpdateLayout
}: WmsWmtsMetadataDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'legend'>('details');
  const [selectedLegendUrl, setSelectedLegendUrl] = useState<string | null>(null);
  const [legendLoading, setLegendLoading] = useState(false);

  useEffect(() => {
    if (isOpen && url) {
      loadCapabilities();
      // Reset view mode when dialog opens
      setViewMode('details');
      setSelectedLegendUrl(null);
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

  const handleViewLegend = (legendUrl: string) => {
    setSelectedLegendUrl(legendUrl);
    setViewMode('legend');
  };

  const handleBackToDetails = () => {
    setViewMode('details');
    setSelectedLegendUrl(null);
  };

  const handleCopyToConfig = (legendUrl: string) => {
    if (!onUpdateLayout || !currentLayout) {
      toast({
        title: "Cannot Update Configuration",
        description: "Layer layout configuration is not available",
        variant: "destructive"
      });
      return;
    }

    // Determine the content location (defaults to layerCard)
    const contentLocation = currentLayout.contentLocation || 'layerCard';
    
    // Update the appropriate legend location
    const updates: Partial<DataSourceLayout> = {
      ...currentLayout,
      [contentLocation]: {
        ...currentLayout[contentLocation],
        legend: {
          ...currentLayout[contentLocation]?.legend,
          type: 'image',
          url: legendUrl
        }
      }
    };

    onUpdateLayout(updates);
    
    toast({
      title: "Legend Configuration Updated",
      description: `Legend URL copied to ${contentLocation === 'layerCard' ? 'layer card' : 'info panel'} configuration`,
    });
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
          <DialogTitle>
            {viewMode === 'legend' ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDetails}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Legend Graphic
              </div>
            ) : (
              `${format.toUpperCase()} GetCapabilities`
            )}
          </DialogTitle>
          {viewMode === 'details' && (
            <DialogDescription className="break-all">
              {url}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Legend View Mode */}
        {viewMode === 'legend' && selectedLegendUrl && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <img 
                src={selectedLegendUrl} 
                alt="Legend Graphic"
                className="w-full h-auto"
                onLoad={() => setLegendLoading(false)}
                onError={() => {
                  setLegendLoading(false);
                  toast({
                    title: "Failed to Load Legend",
                    description: "The legend graphic could not be loaded. The URL may be incorrect or the service may be unavailable.",
                    variant: "destructive"
                  });
                }}
              />
              {legendLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading legend...</span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground break-all">
              <strong>URL:</strong> {selectedLegendUrl}
            </div>
          </div>
        )}

        {/* Details View Mode */}
        {viewMode === 'details' && (
          <>
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
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {displayLayers.map((layer: any, idx: number) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                              Title
                            </td>
                            <td className="py-2 px-3 text-sm">
                              {layer.title}
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                              Name
                            </td>
                            <td className="py-2 px-3 text-sm font-mono break-all">
                              {layer.name}
                            </td>
                          </tr>
                          {layer.abstract && (
                            <tr className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                                Abstract
                              </td>
                              <td className="py-2 px-3 text-sm">
                                {layer.abstract}
                              </td>
                            </tr>
                          )}
                          {layer.hasTimeDimension && (
                            <>
                              <tr className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                                  Temporal Dimension
                                </td>
                                <td className="py-2 px-3 text-sm">
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    Available
                                  </Badge>
                                </td>
                              </tr>
                              {layer.defaultTime && (
                                <tr className="border-b hover:bg-muted/50">
                                  <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                                    Default Timestamp
                                  </td>
                                  <td className="py-2 px-3 text-sm font-mono">
                                    {layer.defaultTime}
                                  </td>
                                </tr>
                              )}
                            </>
                          )}
                          {layer.crs && layer.crs.length > 0 && (
                            <tr className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                                Coordinate Systems
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {layer.crs.map((crs: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs font-mono">
                                      {crs}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          {layer.bbox && (
                            <tr className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                                Bounding Box
                              </td>
                              <td className="py-2 px-3 text-sm font-mono text-xs">
                                <div className="grid grid-cols-2 gap-1">
                                  <div>West: {layer.bbox.west}</div>
                                  <div>East: {layer.bbox.east}</div>
                                  <div>South: {layer.bbox.south}</div>
                                  <div>North: {layer.bbox.north}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/4">
                              Legend Graphic Available
                            </td>
                            <td className="py-2 px-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={layer.hasLegendGraphic ? "default" : "secondary"}
                                  className={layer.hasLegendGraphic ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                                >
                                  {layer.hasLegendGraphic ? "Yes" : "No"}
                                </Badge>
                                {layer.hasLegendGraphic && layer.legendGraphicUrl && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewLegend(layer.legendGraphicUrl)}
                                      className="h-7 gap-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyToConfig(layer.legendGraphicUrl)}
                                      className="h-7 gap-1"
                                    >
                                      <Copy className="h-3 w-3" />
                                      Copy to config
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
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
          </>
        )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WmsWmtsMetadataDialog;
