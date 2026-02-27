import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchCogHeaderMetadata, fetchCogBandStatistics, formatMetadataForDisplay, CogMetadata } from '@/utils/cogMetadata';
import { DataSourceMeta, Category } from '@/types/config';
import MinMaxUpdateDialog from './MinMaxUpdateDialog';
import { generateDivergentColors, rgbToHex } from '@/utils/colorUtils';
import { useToast } from '@/hooks/use-toast';

interface CogMetadataDialogProps {
  url: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
  currentMeta?: DataSourceMeta;
  onUpdateMeta?: (updates: Partial<DataSourceMeta>) => void;
}

const CogMetadataDialog = ({ url, filename, isOpen, onClose, currentMeta, onUpdateMeta }: CogMetadataDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ReturnType<typeof formatMetadataForDisplay> | null>(null);
  const [rawMetadata, setRawMetadata] = useState<CogMetadata | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState(0);

  useEffect(() => {
    if (isOpen && url) {
      loadMetadata();
    }
  }, [isOpen, url]);

  const loadBandStatistics = useCallback(async (bandIndex: number, headerMeta: CogMetadata) => {
    setStatisticsLoading(true);
    setStatisticsError(null);
    
    try {
      const stats = await fetchCogBandStatistics(url, bandIndex, headerMeta.noDataValue);
      const updated: CogMetadata = {
        ...headerMeta,
        minValue: stats.min,
        maxValue: stats.max,
        dataNature: stats.dataNature,
        uniqueValues: stats.uniqueValues,
        sampleCount: stats.sampleCount,
        statisticsBand: bandIndex,
        statisticsNote: stats.note,
      };
      setRawMetadata(updated);
      setMetadata(formatMetadataForDisplay(updated));
    } catch (err) {
      setStatisticsError(err instanceof Error ? err.message : 'Failed to load band statistics');
    } finally {
      setStatisticsLoading(false);
    }
  }, [url]);

  const loadMetadata = async () => {
    setLoading(true);
    setError(null);
    setMetadata(null);
    setRawMetadata(null);
    setSelectedBand(0);
    setStatisticsError(null);

    try {
      const headerMeta = await fetchCogHeaderMetadata(url);
      setRawMetadata(headerMeta);
      setMetadata(formatMetadataForDisplay(headerMeta));
      setLoading(false);
      
      // Auto-load band 0 statistics if min/max not already from GDAL metadata
      if (headerMeta.minValue === undefined || headerMeta.maxValue === undefined) {
        loadBandStatistics(0, headerMeta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
      setLoading(false);
    }
  };

  const handleBandChange = (value: string) => {
    const bandIndex = parseInt(value, 10);
    setSelectedBand(bandIndex);
    if (rawMetadata) {
      // Keep existing metadata visible while loading the next band to avoid transient undefined states
      loadBandStatistics(bandIndex, rawMetadata);
    }
  };

  const handleCopyMinMax = () => {
    if (!rawMetadata || !onUpdateMeta) return;

    const newMin = rawMetadata.minValue;
    const newMax = rawMetadata.maxValue;

    if (newMin === undefined || newMax === undefined) {
      return;
    }

    if (currentMeta?.min === undefined && currentMeta?.max === undefined) {
      const updates: Partial<DataSourceMeta> = {
        min: newMin,
        max: newMax,
      };
      onUpdateMeta(updates);
      return;
    }

    setShowUpdateDialog(true);
  };

  const handleConfirmUpdate = (updateMin: boolean, updateMax: boolean, updateColormaps: boolean) => {
    if (!rawMetadata || !onUpdateMeta) return;

    const newMin = rawMetadata.minValue;
    const newMax = rawMetadata.maxValue;

    if (newMin === undefined || newMax === undefined) return;

    const updates: Partial<DataSourceMeta> = {};

    if (updateMin) updates.min = newMin;
    if (updateMax) updates.max = newMax;

    if (updateColormaps && currentMeta?.colormaps) {
      updates.colormaps = currentMeta.colormaps.map(cm => ({
        ...cm,
        ...(updateMin && { min: newMin }),
        ...(updateMax && { max: newMax })
      }));
    }

    onUpdateMeta(updates);
  };

  const handleRetry = () => {
    loadMetadata();
  };

  const handleCopyCategories = () => {
    if (!rawMetadata?.uniqueValues || !onUpdateMeta) return;

    const uniqueValues = rawMetadata.uniqueValues;
    const colors = generateDivergentColors(uniqueValues.length);

    const newCategories: Category[] = uniqueValues.map((value, index) => ({
      value,
      label: value.toString(),
      color: colors[index]
    }));

    onUpdateMeta({ categories: newCategories });

    toast({
      title: "Categories Created",
      description: `${newCategories.length} categories created from unique values.`,
    });
  };

  const handleCopyEmbeddedColormap = () => {
    if (!rawMetadata?.embeddedColormap || !rawMetadata?.uniqueValues || !onUpdateMeta) return;

    const palette = rawMetadata.embeddedColormap;
    const uniqueValues = rawMetadata.uniqueValues;
    
    const newCategories: Category[] = uniqueValues
      .filter(value => palette[value] !== undefined)
      .map(value => {
        const rgba = palette[value];
        return {
          value,
          label: value.toString(),
          color: rgbToHex(rgba[0], rgba[1], rgba[2])
        };
      });

    onUpdateMeta({ categories: newCategories });

    toast({
      title: "Embedded Colormap Copied",
      description: `${newCategories.length} color entries copied to categories (filtered to unique values in data).`,
    });
  };

  const showBandSelector = rawMetadata && (rawMetadata.multiBand || (rawMetadata.samplesPerPixel && rawMetadata.samplesPerPixel > 1));
  const bandCount = rawMetadata?.samplesPerPixel || 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>COG Metadata</DialogTitle>
          <DialogDescription className="break-all">
            {filename}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading metadata...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Error Loading Metadata</h3>
                <p className="text-sm text-destructive/90">{error}</p>
                {error.includes('CORS') && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This may be due to CORS restrictions on the file server.
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

        {metadata && metadata.length > 0 && (
          <div className="space-y-6">
            {metadata.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  {section.category}
                </h3>

                {/* Band selector — shown above Data Statistics for multi-band files */}
                {section.category.startsWith('Data Statistics') && showBandSelector && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">Band:</span>
                    <Select
                      value={selectedBand.toString()}
                      onValueChange={handleBandChange}
                      disabled={statisticsLoading}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: bandCount }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {statisticsLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Statistics error */}
                {section.category.startsWith('Data Statistics') && statisticsError && (
                  <div className="mb-3 p-2 rounded border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                    {statisticsError}
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {section.items.map((item, itemIdx) => (
                        <tr
                          key={itemIdx}
                          className="border-b last:border-b-0 hover:bg-muted/50"
                        >
                          <td className="py-2 px-3 font-medium text-sm bg-muted/30 w-1/3">
                            {item.label}
                          </td>
                          <td className="py-2 px-3 text-sm font-mono break-all">
                            {item.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Data Statistics Note */}
                {section.category.startsWith('Data Statistics') && rawMetadata?.sampleCount !== undefined && rawMetadata.sampleCount > 0 && (
                  <div className="mt-3 p-3 bg-muted/20 border rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>NOTE:</strong> The above data statistics are based on the sample of pixels indicated and is therefore a guide rather than definitive. Other values or categories may be present in pixels that have not been sampled.
                    </p>
                  </div>
                )}

                {/* Data Statistics Actions */}
                {section.category.startsWith('Data Statistics') && (
                  <div className="mt-3 space-y-3">
                    {/* Embedded Colormap Preview for Unique Values */}
                    {onUpdateMeta && rawMetadata?.embeddedColormap && rawMetadata?.uniqueValues && (
                      <div className="border rounded-lg p-3 bg-muted/20">
                        <p className="text-xs text-muted-foreground mb-2">
                          Embedded Color Palette (for unique values):
                        </p>
                        <div className="grid grid-cols-10 gap-1">
                          {rawMetadata.uniqueValues
                            .slice(0, 20)
                            .filter(value => rawMetadata.embeddedColormap![value] !== undefined)
                            .map((value) => {
                              const rgba = rawMetadata.embeddedColormap![value];
                              const hexColor = rgbToHex(rgba[0], rgba[1], rgba[2]);
                              return (
                                <div
                                  key={value}
                                  className="w-8 h-8 rounded border border-border"
                                  style={{ backgroundColor: hexColor }}
                                  title={`Value: ${value}, Color: ${hexColor}`}
                                />
                              );
                            })}
                        </div>
                        {rawMetadata.uniqueValues.length > 20 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            +{rawMetadata.uniqueValues.length - 20} more values
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyEmbeddedColormap}
                          disabled={statisticsLoading}
                          className="mt-2"
                        >
                          Copy embedded colormap to config categories
                        </Button>
                      </div>
                    )}
                    
                    {onUpdateMeta && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyMinMax}
                          disabled={statisticsLoading || rawMetadata?.minValue === undefined || rawMetadata?.maxValue === undefined || !onUpdateMeta}
                        >
                          Copy min/max to config
                        </Button>
                        {section.items.find(item => item.label === 'Data Nature')?.value === 'Categorical' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyCategories}
                            disabled={statisticsLoading || !rawMetadata?.uniqueValues || !onUpdateMeta}
                          >
                            Copy unique values to config categories
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {metadata && metadata.length === 0 && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            No metadata available for this file.
          </div>
        )}
      </DialogContent>

      {/* Min/Max Update Dialog */}
      {currentMeta && rawMetadata && rawMetadata.minValue !== undefined && rawMetadata.maxValue !== undefined && (
        <MinMaxUpdateDialog
          isOpen={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
          currentMeta={currentMeta}
          newMin={rawMetadata.minValue}
          newMax={rawMetadata.maxValue}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </Dialog>
  );
};

export default CogMetadataDialog;
