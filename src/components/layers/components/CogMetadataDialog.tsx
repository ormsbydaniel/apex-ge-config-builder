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
import { fetchCogMetadata, formatMetadataForDisplay, CogMetadata } from '@/utils/cogMetadata';
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

  useEffect(() => {
    if (isOpen && url) {
      loadMetadata();
    }
  }, [isOpen, url]);

  const loadMetadata = async () => {
    setLoading(true);
    setError(null);
    setMetadata(null);
    setRawMetadata(null);

    try {
      const raw = await fetchCogMetadata(url);
      const formattedMetadata = formatMetadataForDisplay(raw);
      setMetadata(formattedMetadata);
      setRawMetadata(raw);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMinMax = () => {
    if (!rawMetadata || !onUpdateMeta) return;

    const newMin = rawMetadata.minValue;
    const newMax = rawMetadata.maxValue;

    if (newMin === undefined || newMax === undefined) {
      return;
    }

    // Case A: No existing min/max - directly update
    if (currentMeta?.min === undefined && currentMeta?.max === undefined) {
      const updates: Partial<DataSourceMeta> = {
        min: newMin,
        max: newMax,
      };
      onUpdateMeta(updates);
      return;
    }

    // Case B: Existing min/max - show comparison dialog
    setShowUpdateDialog(true);
  };

  const handleConfirmUpdate = (updateMin: boolean, updateMax: boolean, updateColormaps: boolean) => {
    if (!rawMetadata || !onUpdateMeta) return;

    const newMin = rawMetadata.minValue;
    const newMax = rawMetadata.maxValue;

    if (newMin === undefined || newMax === undefined) return;

    const updates: Partial<DataSourceMeta> = {};

    // Update meta min/max
    if (updateMin) updates.min = newMin;
    if (updateMax) updates.max = newMax;

    // Update colormap min/max if requested
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
    
    // Only create categories for values that exist in uniqueValues
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

                {/* Data Statistics Actions */}
                {section.category === 'Data Statistics' && (
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
                          disabled={rawMetadata?.minValue === undefined || rawMetadata?.maxValue === undefined || !onUpdateMeta}
                        >
                          Copy min/max to config
                        </Button>
                        {section.items.find(item => item.label === 'Data Nature')?.value === 'Categorical' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyCategories}
                            disabled={!rawMetadata?.uniqueValues || !onUpdateMeta}
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
      {currentMeta && rawMetadata && (
        <MinMaxUpdateDialog
          isOpen={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
          currentMeta={currentMeta}
          newMin={rawMetadata.minValue!}
          newMax={rawMetadata.maxValue!}
          onConfirm={handleConfirmUpdate}
        />
      )}
    </Dialog>
  );
};

export default CogMetadataDialog;
