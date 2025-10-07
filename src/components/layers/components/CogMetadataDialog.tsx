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
import { fetchCogMetadata, formatMetadataForDisplay } from '@/utils/cogMetadata';

interface CogMetadataDialogProps {
  url: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

const CogMetadataDialog = ({ url, filename, isOpen, onClose }: CogMetadataDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ReturnType<typeof formatMetadataForDisplay> | null>(null);

  useEffect(() => {
    if (isOpen && url) {
      loadMetadata();
    }
  }, [isOpen, url]);

  const loadMetadata = async () => {
    setLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const rawMetadata = await fetchCogMetadata(url);
      const formattedMetadata = formatMetadataForDisplay(rawMetadata);
      setMetadata(formattedMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadMetadata();
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
                {section.category === 'Data Statistics' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Copy min/max to config');
                      }}
                    >
                      Copy min/max to config
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Copy Categories to config');
                      }}
                    >
                      Copy Categories to config
                    </Button>
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
    </Dialog>
  );
};

export default CogMetadataDialog;
